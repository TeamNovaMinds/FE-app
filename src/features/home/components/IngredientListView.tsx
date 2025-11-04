import React from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import { StoredIngredient, TabName } from '../types';
import { styles } from '../styles';
import { EmptyFridgeView } from './EmptyFridgeView';
import { IngredientGridItem } from './IngredientGridItem';

type IngredientListViewProps = {
    isLoading: boolean;
    error: string | null;
    ingredients: StoredIngredient[];
    tabName: TabName;
    color: string;
    onAddIngredient: () => void;
};

export const IngredientListView: React.FC<IngredientListViewProps> = ({
    isLoading,
    error,
    ingredients,
    tabName,
    color,
    onAddIngredient
}) => {
    // 💡 [수정] isLoading이 true이면서 동시에 재료가 0개일 때만 (즉, 첫 로딩 시) 전체 로딩 표시
    if (isLoading && ingredients.length === 0) {
        return (
            <View style={styles.detailLoadingContainer}>
                <ActivityIndicator size="large" color={color} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.detailErrorContainer}>
                <Text style={[styles.emptyText, { color: 'red' }]}>{error}</Text>
            </View>
        );
    }

    // 💡 [수정] 로딩이 끝났고(isLoading=false) 재료가 0개일 때 '비었어요' 표시
    if (!isLoading && ingredients.length === 0) {
        return <EmptyFridgeView tabName={tabName} color={color} onPress={onAddIngredient} />;
    }

    // 💡 [수정] 그 외의 경우 (데이터가 있거나, 데이터가 있는 상태에서 리프레시 중일 때)는 목록을 그대로 표시
    return (
        <FlatList
            data={ingredients}
            renderItem={({ item }) => <IngredientGridItem item={item} />}
            keyExtractor={(item) => item.id.toString()}
            key={tabName}
            numColumns={4}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            style={{ flex: 1 }}
        />
    );
};