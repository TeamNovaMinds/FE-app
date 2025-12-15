import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { TabName, IngredientCountResponse, StoredIngredientResponse, StoredIngredient } from '../types';
import { STORAGE_TYPE_MAP } from '../constants';

// API 함수들
const fetchIngredientCountAPI = async () => {
    const response = await axiosInstance.get<IngredientCountResponse>(
        '/api/refrigerators/stored-items/count'
    );
    if (response.data.isSuccess) {
        return {
            refrigeratorId: response.data.result.refrigeratorId,
            fridge: response.data.result.refrigeratorCount,
            freezer: response.data.result.freezerCount,
            room: response.data.result.roomTempCount,
        };
    }
    throw new Error(response.data.message || '재료 개수를 불러오는데 실패했습니다.');
};

const fetchStoredIngredientsAPI = async (tabName: TabName): Promise<StoredIngredient[]> => {
    const storageType = STORAGE_TYPE_MAP[tabName];
    const response = await axiosInstance.get<StoredIngredientResponse>(
        '/api/refrigerators/stored-items',
        { params: { storageType } }
    );

    if (response.data.isSuccess) {
        return response.data.result.storedIngredients;
    }
    throw new Error(response.data.message || '재료를 불러오는데 실패했습니다.');
};

export const useIngredientData = (activeTab: TabName | null) => {
    // 재료 개수 조회 (항상 활성화, placeholderData로 이전 캐시 먼저 표시)
    const {
        data: ingredientCount = { refrigeratorId: 0, fridge: 0, freezer: 0, room: 0 },
        isLoading,
        error: countError,
        refetch: refetchCount,
    } = useQuery({
        queryKey: ['ingredientCount'],
        queryFn: async () => {
            const result = await fetchIngredientCountAPI();
            console.log('📊 Ingredient Count API Response:', result);
            return result;
        },
        staleTime: 1000 * 60 * 5, // 5분간 fresh
        placeholderData: (previousData) => previousData, // 이전 데이터를 먼저 표시
    });

    // 재료 목록 조회 (activeTab이 있을 때만 활성화, placeholderData 적용)
    const {
        data: storedIngredients = [],
        isLoading: isListLoading,
        error: listError,
    } = useQuery({
        queryKey: ['storedIngredients', activeTab],
        queryFn: () => fetchStoredIngredientsAPI(activeTab!),
        enabled: activeTab !== null, // activeTab이 있을 때만 쿼리 실행
        staleTime: 1000 * 60 * 5, // 5분간 fresh
        placeholderData: (previousData) => previousData, // 이전 데이터를 먼저 표시
    });

    // 에러 메시지 변환
    const error = countError ? '재료 개수를 불러오는 중 오류가 발생했습니다.' : null;
    const isListError = listError ? '재료 목록을 불러오는 중 오류가 발생했습니다.' : null;

    // 데이터 refetch 함수 (기존 인터페이스 유지)
    const fetchIngredientCount = useCallback(async () => {
        await refetchCount();
    }, [refetchCount]);

    return {
        ingredientCount,
        isLoading,
        error,
        storedIngredients,
        isListLoading,
        isListError,
        fetchIngredientCount,
    };
};