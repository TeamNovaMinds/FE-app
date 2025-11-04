// app/add-ingredient-form/[ingredientId].tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axiosInstance from '@/api/axiosInstance';

type StorageType = "ROOM_TEMPERATURE" | "REFRIGERATOR" | "FREEZER";

export default function AddIngredientFormScreen() {
    const router = useRouter();
    const { ingredientId, name } = useLocalSearchParams<{ ingredientId: string, name: string }>();

    const [storageType, setStorageType] = useState<StorageType>('REFRIGERATOR');
    const [quantity, setQuantity] = useState('1');
    const [expirationDate, setExpirationDate] = useState(''); // YYYY-MM-DD
    const [isLoading, setIsLoading] = useState(false);

    const handleAddItem = async () => {
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            Alert.alert('입력 오류', '재료 개수는 1 이상의 숫자여야 합니다.');
            return;
        }

        if (expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            Alert.alert('입력 오류', '유통기한은 YYYY-MM-DD 형식으로 입력해주세요.');
            return;
        }

        setIsLoading(true);

        const payload = {
            ingredientId: Number(ingredientId),
            storageType,
            expirationDate: expirationDate || undefined,
            quantity: parsedQuantity,
        };

        try {
            const response = await axiosInstance.post('/api/refrigerators/stored-items', payload);
            if (response.data.isSuccess) {
                Alert.alert('추가 완료', `${name} 재료를 추가했습니다.`);
                router.replace('/(tabs)/home');
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || '재료 추가 중 오류가 발생했습니다.';
            Alert.alert('오류', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.ingredientName}>{decodeURIComponent(name)}</Text>

                <Text style={styles.label}>보관 방식</Text>
                <View style={styles.storageContainer}>
                    {(["REFRIGERATOR", "FREEZER", "ROOM_TEMPERATURE"] as StorageType[]).map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.storageButton,
                                storageType === type && styles.storageButtonActive,
                            ]}
                            onPress={() => setStorageType(type)}
                        >
                            <Text style={[
                                styles.storageText,
                                storageType === type && styles.storageTextActive
                            ]}>
                                {type === 'REFRIGERATOR' ? '냉장' : type === 'FREEZER' ? '냉동' : '실온'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>재료 개수</Text>
                <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="number-pad"
                    placeholder="1"
                />

                <Text style={styles.label}>유통 기한 (선택)</Text>
                <TextInput
                    style={styles.input}
                    value={expirationDate}
                    onChangeText={setExpirationDate}
                    placeholder="YYYY-MM-DD"
                    maxLength={10}
                />

                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleAddItem}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>냉장고에 추가</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// 스타일 (동일)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    ingredientName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    storageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    storageButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    storageButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    storageText: {
        color: '#333',
        fontWeight: '500',
    },
    storageTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    submitButton: {
        marginTop: 32,
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        height: 50,
        justifyContent: 'center'
    },
    submitButtonDisabled: {
        backgroundColor: '#A9A9A9',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});