import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SuggestedRecipeResponse } from '../types'; // 1단계에서 정의한 타입
import { Link } from 'expo-router';

type RecipeCardSmallProps = {
    item: SuggestedRecipeResponse;
};

export const RecipeCardSmall: React.FC<RecipeCardSmallProps> = React.memo(({ item }) => {

    // ✅ API에서 주는 "EASY", "NORMAL", "HARD" 값을 "쉬움", "보통", "어려움"으로 변환합니다.
    const mapDifficulty = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY': return '쉬움';
            case 'NORMAL': return '보통';
            case 'HARD': return '어려움';
            default: return difficulty;
        }
    };

    return (
        <Link href={`/recipe/${item.recipeId}`} asChild>
            <TouchableOpacity style={styles.card}>
                <Image
                    source={item.mainImageUrl ? { uri: item.mainImageUrl } : require('../../../../assets/images/logo.png')}
                    style={styles.cardImage}
                />

                {/* ✅ 텍스트와 정보들을 담는 컨테이너 추가 */}
                <View style={styles.infoContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

                    {/* ✅ 하트 + 좋아요 개수 (요청사항 반영) */}
                    <View style={styles.cardInfoRow}>
                        <Ionicons name="heart" size={14} color="#FF6347" />
                        <Text style={styles.cardLikesText}>
                            {item.likeCount.toLocaleString()}개
                        </Text>
                    </View>

                    {/* ✅ 나머지 정보 (사진과 동일하게) */}
                    <Text style={styles.cardInfoText}>{item.servings}인분 기준</Text>
                    <Text style={styles.cardInfoText}>
                        평균 조리시간 {item.cookingTimeMinutes}분
                    </Text>
                    <Text style={styles.cardInfoText}>
                        조리 난이도 {mapDifficulty(item.difficulty)}
                    </Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
});

const styles = StyleSheet.create({
    card: {
        width: 150,
        marginRight: 12,
        backgroundColor: '#FFFFFF', // 흰색 배경
        borderRadius: 12,          // 둥근 모서리
        borderWidth: 1,            // 경계선
        borderColor: '#EEEEEE',
    },
    cardImage: {
        width: '100%',
        height: 100,
        backgroundColor: '#f0f0f0',
        // 이미지가 모서리를 덮지 않도록
        borderTopLeftRadius: 11, // card borderRadius - 1
        borderTopRightRadius: 11,
    },
    // ✅ 정보 래퍼 추가
    infoContainer: {
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: 12, // ✅ 요청사항: 하단 여백 추가
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6, // 제목과 정보 사이 여백
    },
    // ✅ 하트 + 숫자 전용 스타일
    cardInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3, // 줄 간격
    },
    cardLikesText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4, // 아이콘과 텍스트 사이
    },
    // ✅ 나머지 정보 텍스트 스타일
    cardInfoText: {
        fontSize: 12,
        color: '#888', // 좋아요 텍스트보다 연하게
        marginTop: 2, // 줄 간격
    },
});