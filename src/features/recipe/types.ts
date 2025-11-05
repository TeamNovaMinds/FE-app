// src/features/recipe/types.ts

export interface AuthorInfo {
    nickname: string;
    profileImageUrl: string;
}

export interface RecipeImage {
    imageUrl: string;
    main: boolean;
}

export interface RecipeIngredient {
    ingredientId: number;
    name?: string; // 재료 이름
    imageUrl?: string; // 재료 이미지
    description: string;
    amount: string;
}

export interface RecipeOrder {
    order: number;
    description: string;
    imageUrl: string;
}

export interface Comment {
    commentId: number;
    content: string;
    authorInfo: AuthorInfo;
    writtenByMe: boolean;
    createdAt: string;
}

export interface RecipeData {
    recipeId: number;
    title: string;
    description: string;
    recipeCategory: 'KOREAN' | 'WESTERN' | 'CHINESE' | 'JAPANESE' | 'OTHER';
    cookingTimeMinutes: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    servings: number;
    likeCount: number;
    likedByMe: boolean;
    writtenByMe: boolean;
    createdAt: string;
    authorInfo: AuthorInfo;
    recipeImageDTOs: RecipeImage[];
    recipeIngredientDTOs: RecipeIngredient[];
    recipeOrderDTOs: RecipeOrder[];
    commentPreview: {
        totalCommentCount: number;
        previewComments: Comment[];
    };
}