import React from 'react';
import { TouchableOpacity, Image, Text } from 'react-native';
import { StoredIngredient } from '../types';
import { styles } from '../styles';

type IngredientGridItemProps = {
    item: StoredIngredient;
    // ✅ 1. onPress prop 타입 추가
    onPress: (item: StoredIngredient) => void;
};

export const IngredientGridItem: React.FC<IngredientGridItemProps> = ({ item, onPress }) => (
    // ✅ 2. onPress 이벤트 연결
    <TouchableOpacity style={styles.gridItem} onPress={() => onPress(item)}>
        <Image
            source={item.imageUrl ? { uri: item.imageUrl } : require('../../../../assets/images/JustFridge_logo.png')}
            style={styles.gridItemImage}
        />
        <Text style={styles.gridItemText} numberOfLines={1}>{item.ingredientName}</Text>
    </TouchableOpacity>
);