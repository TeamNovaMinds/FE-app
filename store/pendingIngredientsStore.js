// store/pendingIngredientsStore.js

import { create } from 'zustand';

/**
 * 재료 검색 화면에서 선택한 재료들을
 * 최종 '추가하기' 버튼을 누르기 전까지 임시 저장하는 스토어
 */
export const usePendingIngredientsStore = create((set, get) => ({
    /**
     * @type {Array<{
     * ingredientId: number,
     * storageType: string,
     * expirationDate?: string,
     * quantity: number
     * }>}
     */
    pendingItems: [],

    /**
     * 재료를 목록에 추가하거나 덮어씁니다. (수정)
     * @param {object} itemToAdd - API 페이로드 형식의 재료 객체
     */
    addItem: (itemToAdd) => set((state) => {
        const existingIndex = state.pendingItems.findIndex(
            (item) => item.ingredientId === itemToAdd.ingredientId
        );

        let updatedItems;
        if (existingIndex > -1) {
            // 이미 존재하면, 해당 아이템을 새 정보로 교체 (수정)
            updatedItems = [...state.pendingItems];
            updatedItems[existingIndex] = itemToAdd;
        } else {
            // 존재하지 않으면, 새 아이템 추가
            updatedItems = [...state.pendingItems, itemToAdd];
        }
        return { pendingItems: updatedItems };
    }),

    /**
     * 재료를 목록에서 제거합니다.
     * @param {number} ingredientIdToRemove - 제거할 재료 ID
     */
    removeItem: (ingredientIdToRemove) => set((state) => ({
        pendingItems: state.pendingItems.filter(
            (item) => item.ingredientId !== ingredientIdToRemove
        ),
    })),

    /**
     * 목록의 모든 재료를 비웁니다. (API 전송 성공 후 호출)
     */
    clearItems: () => set({ pendingItems: [] }),

    /**
     * ID로 특정 재료 정보를 가져옵니다. (폼 채우기용)
     * @param {number} ingredientId - 찾을 재료 ID
     * @returns {object | null}
     */
    getItem: (ingredientId) => {
        return get().pendingItems.find(item => item.ingredientId === ingredientId) || null;
    },
}));