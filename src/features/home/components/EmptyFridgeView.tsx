import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabName } from '../types';
import { styles } from '../styles';

type EmptyFridgeViewProps = {
    tabName: TabName;
    color: string;
    onPress: () => void;
};

export const EmptyFridgeView: React.FC<EmptyFridgeViewProps> = ({ tabName, color, onPress }) => {
    const tabDisplayMessage = {
        fridge: '냉장고가',
        freezer: '냉동고가',
        room: '실온이',
    }[tabName];

    return (
        <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: color }]}>{tabDisplayMessage} 비었어요</Text>
            <Text style={[styles.emptyText, { color: color }]}>재료를 추가해주세요!</Text>

            <TouchableOpacity style={styles.emptyButton} onPress={onPress} activeOpacity={0.7}>
                <Ionicons name="add" size={60} color={color} />
                <Text style={[styles.emptyButtonText, { color: color }]}>재료 추가하기</Text>
            </TouchableOpacity>
        </View>
    );
};