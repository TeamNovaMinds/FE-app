import { create } from 'zustand';

// 회원가입 과정에서 사용할 데이터를 저장하는 store
const useSignupStore = create((set) => ({
    // 각 단계별 데이터
    email: '',
    password: '',
    name: '',
    nickname: '',
    profileImgUrl: null,
    interestCategories: [],

    // 데이터를 업데이트하는 함수들
    setBasicInfo: (email, password, name) => set({ email, password, name }),
    setAdditionalInfo1: (nickname, profileImgUrl) => set({ nickname, profileImgUrl }),
    setInterestCategories: (categories) => set({ interestCategories: categories }),

    // 회원가입 완료 후 상태를 초기화하는 함수
    reset: () => set({
        email: '',
        password: '',
        name: '',
        nickname: '',
        profileImgUrl: null,
        interestCategories: [],
    }),
}));

// 로그인 상태를 관리하는 store
export const useAuthStore = create((set) => ({
    // 로그인 상태
    isAuthenticated: false,
    isLoading: true, // 앱 시작 시 토큰 확인 중

    // 사용자 정보
    user: null, // { nickname, email, ... }

    // 로그인 처리
    login: (userData) => set({
        isAuthenticated: true,
        user: userData,
        isLoading: false,
    }),

    // 로그아웃 처리
    logout: () => set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
    }),

    // 로딩 상태 변경
    setLoading: (loading) => set({ isLoading: loading }),

    // 사용자 정보 업데이트
    updateUser: (updatedUserData) => set((state) => ({
        user: { ...state.user, ...updatedUserData },
    })),
}));

export default useSignupStore;