import React from 'react';
import { TouchableOpacity, Image, Text } from 'react-native';
import { StoredIngredient } from '../types';
import { styles } from '../styles';

type IngredientGridItemProps = {
    item: StoredIngredient;
    // ✅ 1. onPress prop 타입 추가
    onPress?: (item: StoredIngredient) => void;
    disabled?: boolean;
};

export const IngredientGridItem: React.FC<IngredientGridItemProps> = ({ item, onPress, disabled }) => (
    // ✅ 2. onPress 이벤트 연결
    <TouchableOpacity
        style={styles.gridItem}
        onPress={onPress ? () => onPress(item) : undefined}
        disabled={!onPress || disabled}
    >
        <Image
            source={item.imageUrl ? { uri: item.imageUrl } : require('../../../../assets/images/JustFridge_logo.png')}
            style={styles.gridItemImage}
        />
        <Text style={styles.gridItemText} numberOfLines={1}>{item.ingredientName}</Text>
    </TouchableOpacity>
);
