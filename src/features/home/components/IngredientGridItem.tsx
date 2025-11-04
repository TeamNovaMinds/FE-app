import React from 'react';
import { TouchableOpacity, Image, Text } from 'react-native';
import { StoredIngredient } from '../types';
import { styles } from '../styles';

type IngredientGridItemProps = {
    item: StoredIngredient;
};

export const IngredientGridItem: React.FC<IngredientGridItemProps> = ({ item }) => (
    <TouchableOpacity style={styles.gridItem}>
        <Image
            source={item.imageUrl ? { uri: item.imageUrl } : require('../../../../assets/images/logo.png')}
            style={styles.gridItemImage}
        />
        <Text style={styles.gridItemText} numberOfLines={1}>{item.ingredientName}</Text>
    </TouchableOpacity>
);