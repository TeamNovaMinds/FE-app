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

export default useSignupStore;