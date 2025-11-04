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
    Image,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axiosInstance from '@/api/axiosInstance';
import { usePendingIngredientsStore } from '@/store/pendingIngredientsStore'; // 1. 스토어 임포트

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

    // 2. 스토어에서 함수 및 데이터 가져오기
    const { addItem, getItem } = usePendingIngredientsStore();
    // 3. 스토어에서 기존에 추가된 정보가 있는지 확인
    const existingItem = getItem(Number(ingredientId));

    const [storageType, setStorageType] = useState<StorageType>(
        (existingItem?.storageType as StorageType) || // 4. 스토어 값 우선 적용
        (initialStorageType as StorageType) ||
        'REFRIGERATOR'
    );
    // 5. 스토어 값 우선 적용
    const [quantity, setQuantity] = useState(existingItem?.quantity.toString() || '1');
    const [expirationDate, setExpirationDate] = useState(existingItem?.expirationDate || ''); // YYYY-MM-DD

    // 6. isLoading 상태 제거 (API 호출 안 함)
    // const [isLoading, setIsLoading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);

    const [shelfLifeInfo, setShelfLifeInfo] = useState<ShelfLife | null>(null);
    const [ingredientImageUrl, setIngredientImageUrl] = useState<string | null>(null);

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
                setIsImageLoading(true);
                try {
                    const response = await axiosInstance.get(`/api/ingredients/${ingredientId}`);
                    if (response.data.isSuccess && response.data.result) {
                        const { shelfLife, imageUrl } = response.data.result;

                        // 7. 스토어에 기존 값이 없을 때만 API 기반으로 유통기한 추천
                        if (!existingItem && shelfLife) {
                            setShelfLifeInfo(shelfLife);
                            let days = shelfLife.fridgeDays; // 기본값
                            if (storageType === 'FREEZER') {
                                days = shelfLife.freezerDays;
                            } else if (storageType === 'ROOM_TEMPERATURE') {
                                days = shelfLife.roomTempDays;
                            }
                            setExpirationDate(calculateExpiryDate(days));
                        }

                        if (imageUrl) {
                            setIngredientImageUrl(imageUrl);
                        }
                    }
                } catch (error) {
                    console.error('재료 상세 정보 로드 실패:', error);
                } finally {
                    setIsImageLoading(false);
                }
            };
            fetchIngredientDetails();
        }
    }, [ingredientId]); // 8. 의존성 배열에서 getItem 제거 (마운트 시 1회만 실행)

    const handleStorageTypeChange = (type: StorageType) => {
        setStorageType(type);

        // 9. 스토어에 값이 없을 때만 유통기한 자동 계산
        if (!existingItem && shelfLifeInfo) {
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

    // 10. 함수명을 handleConfirmSelection로 변경 (API 호출 -> 스토어 저장)
    const handleConfirmSelection = async () => {
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            Alert.alert('입력 오류', '재료 개수는 1 이상의 숫자여야 합니다.');
            return;
        }

        if (expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            Alert.alert('입력 오류', '유통기한은 YYYY-MM-DD 형식으로 입력해주세요.');
            return;
        }

        // 11. API 페이로드 생성
        const payload = {
            ingredientId: Number(ingredientId),
            storageType,
            expirationDate: expirationDate || undefined,
            quantity: parsedQuantity,
        };

        try {
            // 12. API 대신 스토어에 아이템 추가
            addItem(payload);

            // 13. 성공 알림 없이 바로 이전 화면(검색 모달)으로 복귀
            router.back();

        } catch (error: any) {
            Alert.alert('오류', '목록에 추가하는 중 오류가 발생했습니다.');
        }
        // 14. finally 및 setIsLoading(false) 제거
    };

    // 15. 버튼 텍스트 변경
    const buttonText = existingItem ? "수정 완료" : "목록에 추가";

    return (
        <SafeAreaView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ... (이미지 및 나머지 UI는 동일) ... */}
                    {isImageLoading ? (
                        <View style={styles.imagePlaceholder}>
                            <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    ) : (
                        ingredientImageUrl ? (
                            <Image source={{ uri: ingredientImageUrl }} style={styles.ingredientImage} />
                        ) : (
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

                    {/* 16. 버튼 핸들러 및 텍스트 수정 */}
                    <TouchableOpacity
                        style={styles.submitButton} // disabled 스타일 제거
                        onPress={handleConfirmSelection}
                        // disabled={isLoading} // isLoading 제거
                    >
                        <Text style={styles.submitButtonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

// ... (스타일은 기존과 동일)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        flexGrow: 1,
    },
    ingredientImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        alignSelf: 'center',
        marginBottom: 20,
        backgroundColor: '#E0E0E0',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 12,
        alignSelf: 'center',
        marginBottom: 20,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        backgroundColor: '#62A1FF',
        borderColor: '#62A1FF',
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
        backgroundColor: '#62A1FF',
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