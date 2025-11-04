import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SuggestedRecipeResponse } from '../types'; // 1단계에서 정의한 타입
import { Link } from 'expo-router';

type RecipeCardSmallProps = {
    item: SuggestedRecipeResponse;
};

export const RecipeCardSmall: React.FC<RecipeCardSmallProps> = ({ item }) => {
    return (
        <Link href={`/recipe/${item.recipeId}`} asChild>
            <TouchableOpacity style={styles.card}>
                <Image
                    source={item.mainImageUrl ? { uri: item.mainImageUrl } : require('../../../../assets/images/logo.png')}
                    style={styles.cardImage}
                />
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardInfoRow}>
                    <Ionicons name="heart" size={14} color="#FF6347" />
                    <Text style={styles.cardInfoText}>{item.likeCount.toLocaleString()}</Text>
                </View>
                <Text style={styles.cardInfoText}>1인분 기준</Text>
                <Text style={styles.cardInfoText}>평균 조리시간 {item.cookingTimeMinutes}분</Text>
                <Text style={styles.cardInfoText}>조리 난이도 {item.difficulty}</Text>
            </TouchableOpacity>
        </Link>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 150,
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    cardImage: {
        width: '100%',
        height: 100,
        backgroundColor: '#f0f0f0',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 8,
        marginHorizontal: 10,
    },
    cardInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginHorizontal: 10,
    },
    cardInfoText: {
        fontSize: 12,
        color: '#666',
        marginHorizontal: 10,
        marginTop: 2,
    },
});