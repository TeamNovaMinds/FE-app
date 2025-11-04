// API 응답 타입 정의
export interface IngredientCountResponse {
    isSuccess: boolean;
    code: string;
    message: string;
    result: {
        refrigeratorCount: number;
        freezerCount: number;
        roomTempCount: number;
    };
}

export interface StoredIngredient {
    id: number;
    ingredientId: number;
    ingredientName: string;
    imageUrl: string | null;
    quantity: number;
    storageType: string;
    expirationDate: string;
    version: number;
    dday: string;
}

export interface StoredIngredientResponse {
    isSuccess: boolean;
    code: string;
    message: string;
    result: {
        addedCount: number;
        storedIngredients: StoredIngredient[];
    };
}

export type TabName = 'fridge' | 'freezer' | 'room';