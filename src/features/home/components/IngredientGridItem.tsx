import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
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
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
        />
        <Text style={styles.gridItemText} numberOfLines={1}>{item.ingredientName}</Text>
    </TouchableOpacity>
);
