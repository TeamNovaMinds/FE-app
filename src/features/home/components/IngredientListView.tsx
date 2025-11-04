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
    if (isLoading) {
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

    if (ingredients.length === 0) {
        return <EmptyFridgeView tabName={tabName} color={color} onPress={onAddIngredient} />;
    }

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