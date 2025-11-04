// app/add-ingredient-form/[ingredientId].tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image, // ✅ Image 컴포넌트 임포트
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axiosInstance from '@/api/axiosInstance';

type StorageType = "ROOM_TEMPERATURE" | "REFRIGERATOR" | "FREEZER";

interface ShelfLife {
    fridgeDays: number;
    freezerDays: number;
    roomTempDays: number;
}

export default function AddIngredientFormScreen() {
    const router = useRouter();
    const { ingredientId, name, storageType: initialStorageType } = useLocalSearchParams<{
        ingredientId: string;
        name: string;
        storageType?: string;
    }>();

    const [storageType, setStorageType] = useState<StorageType>(
        (initialStorageType as StorageType) || 'REFRIGERATOR'
    );
    const [quantity, setQuantity] = useState('1');
    const [expirationDate, setExpirationDate] = useState(''); // YYYY-MM-DD
    const [isLoading, setIsLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true); // ✅ 이미지 로딩 상태

    const [shelfLifeInfo, setShelfLifeInfo] = useState<ShelfLife | null>(null);
    const [ingredientImageUrl, setIngredientImageUrl] = useState<string | null>(null); // ✅ 재료 이미지 URL 상태

    const calculateExpiryDate = (days: number): string => {
        if (!days || days <= 0) return '';
        const today = new Date();
        today.setDate(today.getDate() + days);
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    useEffect(() => {
        if (ingredientId) {
            const fetchIngredientDetails = async () => {
                setIsImageLoading(true); // ✅ 이미지 로딩 시작
                try {
                    const response = await axiosInstance.get(`/api/ingredients/${ingredientId}`);
                    if (response.data.isSuccess && response.data.result) {
                        const { shelfLife, imageUrl } = response.data.result;

                        // ✅ 유통기한 정보 설정
                        if (shelfLife) {
                            setShelfLifeInfo(shelfLife);

                            // initialStorageType에 따라 적절한 유통기한 계산
                            let days = shelfLife.fridgeDays; // 기본값
                            if (storageType === 'FREEZER') {
                                days = shelfLife.freezerDays;
                            } else if (storageType === 'ROOM_TEMPERATURE') {
                                days = shelfLife.roomTempDays;
                            }
                            setExpirationDate(calculateExpiryDate(days));
                        }

                        // ✅ 이미지 URL 설정
                        if (imageUrl) {
                            setIngredientImageUrl(imageUrl);
                        }
                    }
                } catch (error) {
                    console.error('재료 상세 정보 로드 실패:', error);
                } finally {
                    setIsImageLoading(false); // ✅ 이미지 로딩 종료
                }
            };
            fetchIngredientDetails();
        }
    }, [ingredientId]); // storageType은 의존성에서 제거 (초기값만 사용)

    const handleStorageTypeChange = (type: StorageType) => {
        setStorageType(type);

        if (shelfLifeInfo) {
            let days = 0;
            if (type === 'REFRIGERATOR') {
                days = shelfLifeInfo.fridgeDays;
            } else if (type === 'FREEZER') {
                days = shelfLifeInfo.freezerDays;
            } else if (type === 'ROOM_TEMPERATURE') {
                days = shelfLifeInfo.roomTempDays;
            }

            setExpirationDate(calculateExpiryDate(days));
        }
    };

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
                Alert.alert('추가 완료', `${decodeURIComponent(name)} 재료를 추가했습니다.`, [
                    {
                        text: '확인',
                        onPress: () => {
                            router.dismiss(2); // 현재 모달창 전부 닫기
                        }
                    }
                ]);
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
                {/* ✅ 재료 이미지 표시 */}
                {isImageLoading ? (
                    <View style={styles.imagePlaceholder}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    ingredientImageUrl ? (
                        <Image source={{ uri: ingredientImageUrl }} style={styles.ingredientImage} />
                    ) : (
                        // 이미지가 없을 경우 대체 아이콘이나 텍스트 표시 가능
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.noImageText}>이미지 없음</Text>
                        </View>
                    )
                )}

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
                            onPress={() => handleStorageTypeChange(type)}
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
                    placeholder="YYYY-MM-DD (자동 계산)"
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    // ✅ 재료 이미지 스타일 추가
    ingredientImage: {
        width: 100,
        height: 100,
        borderRadius: 50, // 원형 이미지
        alignSelf: 'center', // 가운데 정렬
        marginBottom: 20, // 아래 여백
        backgroundColor: '#E0E0E0', // 로딩 중 또는 이미지 없을 때 배경색
        resizeMode: 'cover', // 이미지가 꽉 차게 보이도록
    },
    // ✅ 이미지 로딩 플레이스홀더 스타일
    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignSelf: 'center',
        marginBottom: 20,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ✅ 이미지 없을 때 텍스트 스타일
    noImageText: {
        color: '#666',
        fontSize: 12,
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