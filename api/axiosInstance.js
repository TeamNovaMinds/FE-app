import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json', // 모든 요청에 JSON 타입 헤더를 명시
    },
    withCredentials: true, // 👈 이 설정이 가장 중요합니다!
});

export default axiosInstance;