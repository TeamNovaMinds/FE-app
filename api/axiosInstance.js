import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// RefreshToken 재발급 중복 방지용 플래그
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// 요청 인터셉터: 모든 요청에 AccessToken 자동 추가
axiosInstance.interceptors.request.use(
    async (config) => {
        // 로그인, 회원가입 관련 API는 토큰 필요 없음
        const noAuthUrls = [
            '/api/auth/login',
            '/api/auth/signup',
            '/api/auth/refresh',
            '/api/auth/check-email',
            '/api/auth/check-nickname'
        ];
        const isNoAuthUrl = noAuthUrls.some(url => config.url.includes(url));

        if (!isNoAuthUrl) {
            const accessToken = await getAccessToken();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 401 에러 시 RefreshToken으로 재발급
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 에러이고, 아직 재시도 안 했을 때
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // 이미 refresh 중이면 대기
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) {
                    throw new Error('RefreshToken이 없습니다.');
                }

                // RefreshToken으로 새 AccessToken 발급
                const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                    refreshToken,
                });

                if (response.data.isSuccess) {
                    const { accessToken, refreshToken: newRefreshToken } = response.data.result;

                    // 새 토큰 저장
                    await saveTokens(accessToken, newRefreshToken);

                    // 대기 중인 요청들 처리
                    processQueue(null, accessToken);

                    // 원래 요청 재시도
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // RefreshToken 재발급 실패 시 로그아웃
                processQueue(refreshError, null);
                await clearTokens();

                // 로그인 화면으로 이동은 앱에서 처리하도록 에러 반환
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;