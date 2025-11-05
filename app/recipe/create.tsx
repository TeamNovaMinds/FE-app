// app/recipe/create.tsx

import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    findNodeHandle,
    ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '@/api/axiosInstance';
import debounce from 'lodash.debounce';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, validateFileSize, validateFileType } from '@/utils/imageUpload';

// --- (타입 정의 및 상수는 이전과 동일) ---
interface Ingredient {
    ingredientId: number | null;
    description: string;
    amount: string;
}
interface Step {
    order: number;
    description: string;
    imageUrl: string | null;
}
interface ApiIngredient {
    id: number;
    name: string;
}

export default function CreateRecipeScreen() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mainImages, setMainImages] = useState<string[]>([]);    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [recipeCategory, setRecipeCategory] = useState<string>('KOREAN');
    const [servings, setServings] = useState('');
    const [time, setTime] = useState('');
    const [difficulty, setDifficulty] = useState('EASY');
    const [ingredients, setIngredients] = useState<Ingredient[]>([{ ingredientId: null, description: '', amount: '' }]);
    const [steps, setSteps] = useState<Step[]>([{ order: 1, description: '', imageUrl: null }]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalResults, setModalResults] = useState<ApiIngredient[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [currentIngredientIndex, setCurrentIngredientIndex] = useState(0);
    const [isImageUploading, setIsImageUploading] = useState(false);

    const scrollRef = useRef<KeyboardAwareScrollView>(null);

    // --- (핸들러 함수들... 이전과 동일) ---
    const handleIngredientChange = (index: number, field: 'amount', value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    const addIngredient = () => setIngredients([...ingredients, { ingredientId: null, description: '', amount: '' }]);
    const removeIngredient = (indexToRemove: number) => {
        if (ingredients.length > 1) setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
    };

    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index].description = value;
        setSteps(newSteps);
    };

    const addStep = () => setSteps([...steps, { order: steps.length + 1, description: '', imageUrl: null }]);
    const removeStep = (indexToRemove: number) => {
        if (steps.length > 1) {
            const newSteps = steps.filter((_, index) => index !== indexToRemove);
            setSteps(newSteps.map((step, index) => ({ ...step, order: index + 1 })));
        }
    };

    const fetchModalIngredients = async (keyword: string) => {
        setModalLoading(true);
        try {
            const response = await axiosInstance.get('/api/ingredients', { params: { keyword: keyword || undefined } });
            if (response.data.isSuccess) setModalResults(response.data.result.ingredients);
        } catch (error) { console.error("Ingredient search error:", error); }
        finally { setModalLoading(false); }
    };

    const debouncedSearch = useCallback(debounce(fetchModalIngredients, 300), []);

    const openIngredientModal = (index: number) => {
        setCurrentIngredientIndex(index);
        setModalSearchQuery('');
        setModalResults([]);
        setIsModalVisible(true);
        fetchModalIngredients('');
    };

    const onSelectIngredient = (ingredient: ApiIngredient) => {
        const newIngredients = [...ingredients];
        newIngredients[currentIngredientIndex].ingredientId = ingredient.id;
        newIngredients[currentIngredientIndex].description = ingredient.name;
        setIngredients(newIngredients);
        setIsModalVisible(false);
    };

    const handlePickImage = async (type: 'main' | 'step', index?: number) => {
        try {
            // 갤러리 권한 요청
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
                return;
            }

            // 이미지 선택
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: type === 'main' ? [16, 9] : [4, 3],
                quality: 0.8,
                // allowsMultipleSelection: false, // (기본값)
            });

            if (result.canceled) {
                return;
            }

            const selectedImage = result.assets[0];
            const imageUri = selectedImage.uri;
            const fileName = imageUri.split('/').pop() || 'image.jpg';

            // 파일 타입 검증
            if (!validateFileType(fileName)) {
                Alert.alert('파일 형식 오류', 'jpg, jpeg, png, gif, webp 파일만 업로드 가능합니다.');
                return;
            }

            // 파일 크기 검증 (fileSize가 있는 경우)
            if (selectedImage.fileSize && !validateFileSize(selectedImage.fileSize)) {
                Alert.alert('파일 크기 오류', '10MB 이하의 이미지만 업로드 가능합니다.');
                return;
            }

            // 로딩 시작
            setIsImageUploading(true);

            // 이미지 업로드
            const { imageUrl } = await uploadImage(imageUri, fileName);

            // 업로드 성공 후 상태 업데이트
            if (type === 'main') {
                setMainImages((prevImages) => [...prevImages, imageUrl]);
            } else if (type === 'step' && index !== undefined) {
                const newSteps = [...steps];
                newSteps[index].imageUrl = imageUrl;
                setSteps(newSteps);
            }

            Alert.alert('성공', '이미지가 업로드되었습니다.');
        } catch (error: any) {
            console.error('이미지 업로드 오류:', error);
            const errorMessage = error?.message || '이미지 업로드 중 오류가 발생했습니다.';
            Alert.alert('업로드 실패', errorMessage);
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleRemoveMainImage = (indexToRemove: number) => {
        setMainImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
    };

    const handleSetMainImage = (indexToMakeMain: number) => {
        // 이미 0번 인덱스(대표 사진)이면 아무것도 안 함
        if (indexToMakeMain === 0) return;

        setMainImages((prevImages) => {
            const selectedImage = prevImages[indexToMakeMain];
            const otherImages = prevImages.filter((_, index) => index !== indexToMakeMain);
            // 선택한 이미지를 0번으로, 나머지를 뒤에 붙여 새 배열 생성
            return [selectedImage, ...otherImages];
        });
    };

    const handleCreateRecipe = async () => {
        if (!title || !time || !difficulty || !servings || !description || ingredients.some(i => !i.ingredientId || !i.amount) || steps.some(s => !s.description)) {
            Alert.alert('입력 오류', '모든 필수 항목을 입력해주세요.');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                title, description, recipeCategory,
                cookingTimeMinutes: parseInt(time, 10),
                difficulty,
                servings: parseInt(servings, 10),
                recipeImages: mainImages,
                ingredients: ingredients.map(i => ({ ingredientId: i.ingredientId, amount: i.amount })),
                orders: steps,
            };
            const response = await axiosInstance.post('/api/recipes', payload);
            if (response.data.isSuccess) {
                Alert.alert('성공', '레시피가 성공적으로 등록되었습니다.');
                router.back();
            } else { throw new Error(response.data.message); }
        } catch (error: any) {
            const message = error.response?.data?.message || '레시피 등록 중 오류가 발생했습니다.';
            Alert.alert('등록 실패', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // '만드는 방법' 입력창 전용 포커스 핸들러
    const handleStepInputFocus = (event: any) => {
        const node = findNodeHandle(event.nativeEvent.target);
        if (node && scrollRef.current) {
            setTimeout(() => {
                // 이 노드(TextInput)로 스크롤하도록 명령합니다.
                scrollRef.current?.scrollToFocusedInput(node, 100, 0);
            }, 100);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
                <Text style={styles.headerTitle}>레시피 등록</Text>
                <TouchableOpacity onPress={handleCreateRecipe} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#007AFF" /> : <Text style={styles.submitButtonText}>등록</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView
                ref={scrollRef}
                style={styles.flexContainer}
                contentContainerStyle={styles.scrollContainer}
                extraScrollHeight={20}
                enableOnAndroid={true}
                keyboardShouldPersistTaps="handled"
                // ✅ enableAutomaticScroll={false} 속성 제거! (자동 스크롤 다시 켬)
            >
                <View style={styles.imagePickerContainer}>
                    <ScrollView horizontal contentContainerStyle={styles.imageScrollContainer}>

                        {/* 선택된 이미지 썸네일 목록 */}
                        {mainImages.map((uri, index) => (
                            <View key={index} style={styles.imageThumbnailContainer}>
                                {/* 이미지를 탭하면 대표 사진으로 설정 */}
                                <TouchableOpacity
                                    onPress={() => handleSetMainImage(index)}
                                    activeOpacity={0.8}
                                >
                                    <Image source={{ uri }} style={styles.imageThumbnail} />
                                </TouchableOpacity>

                                {/* 대표 사진(0번 인덱스)일 경우 배지 표시 */}
                                {index === 0 && (
                                    <View style={styles.mainImageBadge}>
                                        <Text style={styles.mainImageBadgeText}>대표</Text>
                                    </View>
                                )}

                                {/* 삭제 버튼 */}
                                <TouchableOpacity
                                    style={styles.imageDeleteButton}
                                    onPress={() => handleRemoveMainImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#FF6347" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* 사진 추가 버튼 */}
                        <TouchableOpacity
                            style={[styles.imagePickerButton, (isImageUploading) && styles.disabledButton]}
                            onPress={() => handlePickImage('main')}
                            disabled={isImageUploading}
                        >
                            {isImageUploading ? (
                                <ActivityIndicator size="small" color="#007AFF" />
                            ) : (
                                <>
                                    <Ionicons name="camera" size={32} color="#888" />
                                    <Text style={styles.imagePickerText}>사진 추가</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <Text style={styles.imageHintText}>
                    대표 라고 표시된 맨 앞 사진이 썸네일에서 보여지는 메인 이미지입니다.{'\n'}
                    사진을 터치하여 메인 이미지를 선택하실 수 있습니다.
                </Text>

                {/* ✅ onFocus 핸들러 제거 */}
                <Text style={styles.label}>레시피 제목</Text>
                <TextInput style={styles.input} placeholder="예) 초간단 김치볶음밥" value={title} onChangeText={setTitle} />

                {/* ✅ onFocus 핸들러 제거 */}
                <Text style={styles.label}>레시피 설명</Text>
                <TextInput style={styles.inputDescription} placeholder="이 레시피에 대해 간단히 설명해주세요." value={description} onChangeText={setDescription} multiline />

                {/* ✅ onFocus 핸들러 제거 */}
                <Text style={styles.label}>카테고리</Text>
                <TextInput style={styles.input} placeholder="예: KOREAN" value={recipeCategory} onChangeText={setRecipeCategory} autoCapitalize="characters" />

                <View style={styles.row}>
                    <View style={styles.flexInput}>
                        <Text style={styles.label}>인분</Text>
                        <TextInput style={styles.input} placeholder="예: 2" value={servings} onChangeText={setServings} keyboardType="numeric" />
                    </View>
                    <View style={styles.flexInput}>
                        <Text style={styles.label}>소요시간</Text>
                        <TextInput style={styles.input} placeholder="예: 15 (분)" value={time} onChangeText={setTime} keyboardType="numeric" />
                    </View>
                    <View style={styles.flexInput}>
                        <Text style={styles.label}>난이도</Text>
                        <TextInput style={styles.input} placeholder="EASY" value={difficulty} onChangeText={setDifficulty} autoCapitalize="characters" />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>재료</Text>
                {ingredients.map((item, index) => (
                    <View key={index} style={[styles.row, { alignItems: 'center' }]}>
                        <TouchableOpacity style={[styles.input, styles.flexInput, styles.ingredientButton]} onPress={() => openIngredientModal(index)}>
                            <Text style={item.description ? styles.ingredientText : styles.ingredientPlaceholder}>{item.description || '재료 검색'}</Text>
                        </TouchableOpacity>
                        {/* ✅ onFocus 핸들러 제거 */}
                        <TextInput style={[styles.input, { flex: 0.6 }]} placeholder="용량 (예: 300g)" value={item.amount} onChangeText={(text) => handleIngredientChange(index, 'amount', text)} />
                        {ingredients.length > 1 && (
                            <TouchableOpacity onPress={() => removeIngredient(index)} style={styles.deleteButton}>
                                <Ionicons name="remove-circle-outline" size={24} color="#FF6347" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                    <Ionicons name="add-circle-outline" size={20} color="#555" />
                    <Text style={styles.addButtonText}>재료 추가</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>만드는 방법</Text>
                {steps.map((item, index) => (
                    <View key={index} style={styles.stepContainer}>
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                        <View style={styles.stepContentWrapper}>
                            <View style={styles.stepContent}>
                                <TextInput
                                    style={styles.stepInput}
                                    multiline
                                    placeholder="만드는 방법을 입력해주세요."
                                    value={item.description}
                                    onChangeText={(text) => handleStepChange(index, text)}
                                    // ✅ 여기만 onFocus 핸들러를 유지합니다. (함수 이름 변경)
                                    onFocus={handleStepInputFocus}
                                />
                                <TouchableOpacity style={styles.stepImagePicker} onPress={() => handlePickImage('step', index)}>
                                    <Ionicons name="camera-outline" size={28} color="#888" />
                                </TouchableOpacity>
                            </View>
                            {item.imageUrl && (
                                <View style={styles.stepImagePreviewContainer}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.stepImagePreview} />
                                    <TouchableOpacity
                                        style={styles.stepImageDeleteButton}
                                        onPress={() => {
                                            const newSteps = [...steps];
                                            newSteps[index].imageUrl = null;
                                            setSteps(newSteps);
                                        }}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#FF6347" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        {steps.length > 1 && (
                            <TouchableOpacity onPress={() => removeStep(index)} style={styles.deleteButton}>
                                <Ionicons name="remove-circle-outline" size={24} color="#FF6347" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addStep}>
                    <Ionicons name="add-circle-outline" size={20} color="#555" />
                    <Text style={styles.addButtonText}>단계 추가</Text>
                </TouchableOpacity>

            </KeyboardAwareScrollView>

            {/* ... (모달 코드는 이전과 동일) ... */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>재료 검색</Text>
                        <TextInput
                            style={styles.modalSearchInput}
                            placeholder="재료 이름 검색..."
                            value={modalSearchQuery}
                            onChangeText={(text) => {
                                setModalSearchQuery(text);
                                debouncedSearch(text);
                            }}
                        />
                        {modalLoading && <ActivityIndicator style={{ marginVertical: 20 }} />}
                        <FlatList
                            data={modalResults}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => onSelectIngredient(item)}>
                                    <Text>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={!modalLoading && modalSearchQuery.length > 0 ? <Text style={styles.modalEmptyText}>검색 결과가 없습니다.</Text> : null}
                        />
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
                            <Text style={styles.modalCloseText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    flexContainer: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
    submitButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40
    },
    imagePickerContainer: {
        marginTop: 16, // ⬅️ 헤더와 간격 추가
        marginBottom: 8, // 24 -> 8 (안내 문구 공간 확보)
    },
    imageScrollContainer: {
        paddingVertical: 10,
        alignItems: 'center',
    },

    imageHintText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginBottom: 16, // "레시피 제목" 라벨과의 간격
    },

    imageThumbnailContainer: {
        position: 'relative',
        width: 142,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    imageThumbnail: {
        width: '100%',
        height: '100%',
    },

    // ✅ 3. 대표 사진 배지 스타일
    mainImageBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        backgroundColor: 'rgba(0, 122, 255, 0.9)', // (파란색)
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        zIndex: 1, // 삭제 버튼보다 아래
    },
    mainImageBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // ✅ 3. 삭제 버튼 스타일 (zIndex 추가)
    imageDeleteButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        padding: 1,
        zIndex: 2, // 배지보다 위에
    },
    imagePickerButton: {
        width: 100,
        height: 80,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    disabledButton: {
        opacity: 0.5,
    },
    imagePickerText: { color: '#aaa', marginTop: 8, fontSize: 14 },
    imagePreview: { width: '100%', height: '100%', borderRadius: 12 },
    label: { fontSize: 14, fontWeight: '500', color: '#888', marginBottom: 8, marginTop: 12 },
    input: {
        borderBottomWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    inputDescription: {
        minHeight: 60,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 16,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    row: { flexDirection: 'row', gap: 16 },
    flexInput: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 24 },
    addButton: { flexDirection: 'row', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
    addButtonText: { color: '#555', fontWeight: '500', marginLeft: 4, fontSize: 15 },
    stepContainer: { flexDirection: 'row', marginBottom: 20, gap: 12, alignItems: 'flex-start' },
    stepNumber: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', paddingTop: 10 },
    stepContentWrapper: { flex: 1 },
    stepContent: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd' },
    stepInput: { flex: 1, minHeight: 60, fontSize: 16, paddingTop: 10, paddingBottom: 12, textAlignVertical: 'top' },
    stepImagePicker: { padding: 10 },
    stepImagePreviewContainer: { marginTop: 12, position: 'relative', width: '100%', height: 150, borderRadius: 8, overflow: 'hidden' },
    stepImagePreview: { width: '100%', height: '100%', borderRadius: 8 },
    stepImageDeleteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 12, padding: 2 },
    deleteButton: { justifyContent: 'center', paddingLeft: 8, paddingTop: 10 },
    ingredientButton: { justifyContent: 'center', paddingVertical: 12 },
    ingredientText: { fontSize: 16, color: '#000' },
    ingredientPlaceholder: { fontSize: 16, color: '#c7c7cd' },
    // --- Modal Styles ---
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '90%', maxHeight: '80%', backgroundColor: 'white', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    modalSearchInput: { height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
    modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalEmptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
    modalCloseButton: { marginTop: 20, padding: 12, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center' },
    modalCloseText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});