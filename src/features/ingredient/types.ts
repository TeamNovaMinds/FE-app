// src/features/ingredient/types.ts

// API 명세서에서 찾을 수 없는 타입이라, 샘플 응답을 기반으로 추론했습니다.
export interface IngredientInfo {
    name: string;
    amount: string;
    hasIngredient: boolean;
}

// 추천 레시피 카드 DTO
export interface SuggestedRecipeResponse {
    recipeId: number;
    title: string;
    mainImageUrl: string | null;
    cookingTimeMinutes: number;
    difficulty: string; // "EASY", "NORMAL", "HARD" 등
    servings: number; // 인분 수
    likeCount: number;
    commentCount: number;
    ingredients: IngredientInfo[];
    createdAt: string; // "yyyy-MM-dd HH:mm"
}

// 추천 레시피 그룹 (API 응답 기준)
export interface SuggestedRecipeGroup {
    ingredientName: string;
    recipes: SuggestedRecipeResponse[];
}

// 최종 API 응답 DTO
export interface SuggestedRecipeListResponse {
    recipes: SuggestedRecipeGroup[];
    hasNext: boolean;
    nextCursor: number | null;
}

// API 응답의 'result' 필드를 위한 래퍼 타입
export interface ApiSuccessResponse<T> {
    isSuccess: boolean;
    code: string;
    message: string;
    result: T;
}