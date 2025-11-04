import { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { TabName, IngredientCountResponse, StoredIngredientResponse, StoredIngredient } from '../types';
import { STORAGE_TYPE_MAP } from '../constants';

export const useIngredientData = (activeTab: TabName | null) => {
    // 요약(count) 상태
    const [ingredientCount, setIngredientCount] = useState({
        fridge: 0,
        freezer: 0,
        room: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 재료 목록 상태
    const [storedIngredients, setStoredIngredients] = useState<StoredIngredient[]>([]);
    const [isListLoading, setIsListLoading] = useState(false);
    const [isListError, setIsListError] = useState<string | null>(null);

    // 요약(count) API 호출
    const fetchIngredientCount = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await axiosInstance.get<IngredientCountResponse>(
                '/api/refrigerators/stored-items/count'
            );
            if (response.data.isSuccess) {
                setIngredientCount({
                    fridge: response.data.result.refrigeratorCount,
                    freezer: response.data.result.freezerCount,
                    room: response.data.result.roomTempCount,
                });
            } else {
                setError('재료 개수를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('재료 개수 조회 에러:', err);
            setError('재료 개수를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 재료 목록 API 호출
    const fetchStoredIngredients = async (tabName: TabName) => {
        setIsListLoading(true);
        setIsListError(null);
        setStoredIngredients([]);
        try {
            const storageType = STORAGE_TYPE_MAP[tabName];
            const response = await axiosInstance.get<StoredIngredientResponse>(
                '/api/refrigerators/stored-items',
                { params: { storageType } }
            );

            if (response.data.isSuccess) {
                setStoredIngredients(response.data.result.storedIngredients);
            } else {
                setIsListError(response.data.message || '재료를 불러오는데 실패했습니다.');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || '재료 목록을 불러오는 중 오류가 발생했습니다.';
            console.error('재료 목록 조회 에러:', err);
            setIsListError(message);
        } finally {
            setIsListLoading(false);
        }
    };

    // 마운트 시 요약(count) 정보 가져오기
    useEffect(() => {
        fetchIngredientCount();
    }, []);

    // activeTab 변경 시 재료 목록 가져오기
    useEffect(() => {
        if (activeTab) {
            fetchStoredIngredients(activeTab);
        } else {
            setStoredIngredients([]);
            setIsListError(null);
        }
    }, [activeTab]);

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