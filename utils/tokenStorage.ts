import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'userInfo';

// 사용자 정보 타입 정의
export interface UserInfo {
    email?: string;
    name?: string;
    [key: string]: any;
}

// AccessToken 저장
export const saveAccessToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
        console.error('AccessToken 저장 실패:', error);
    }
};

// RefreshToken 저장
export const saveRefreshToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
        console.error('RefreshToken 저장 실패:', error);
    }
};

// 두 토큰 한번에 저장
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
    try {
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
        ]);
    } catch (error) {
        console.error('토큰 저장 실패:', error);
    }
};

// 사용자 정보 저장
export const saveUserInfo = async (userInfo: UserInfo): Promise<void> => {
    try {
        await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userInfo));
    } catch (error) {
        console.error('사용자 정보 저장 실패:', error);
    }
};

// 토큰과 사용자 정보 한번에 저장
export const saveAuthData = async (accessToken: string, refreshToken: string, userInfo: UserInfo): Promise<void> => {
    try {
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
            SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userInfo)),
        ]);
    } catch (error) {
        console.error('인증 데이터 저장 실패:', error);
    }
};

// AccessToken 불러오기
export const getAccessToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.error('AccessToken 불러오기 실패:', error);
        return null;
    }
};

// RefreshToken 불러오기
export const getRefreshToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('RefreshToken 불러오기 실패:', error);
        return null;
    }
};

// 사용자 정보 불러오기
export const getUserInfo = async (): Promise<UserInfo | null> => {
    try {
        const userInfoStr = await SecureStore.getItemAsync(USER_INFO_KEY);
        return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        return null;
    }
};

// 모든 인증 데이터 삭제 (로그아웃 시 사용)
export const clearAuthData = async (): Promise<void> => {
    try {
        await Promise.all([
            SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
            SecureStore.deleteItemAsync(USER_INFO_KEY),
        ]);
    } catch (error) {
        console.error('인증 데이터 삭제 실패:', error);
    }
};

// 기존 함수와의 호환성을 위해 유지
export const clearTokens = clearAuthData;