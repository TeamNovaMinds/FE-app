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
import { Stack, useRouter } from 'expo-router';
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
    category: string;
    imageUrl: string | null;
}

// 카테고리 상수 정의
const RECIPE_CATEGORIES = [
    { value: 'KOREAN', label: '한식' },
    { value: 'CHINESE', label: '중식' },
    { value: 'JAPANESE', label: '일식' },
    { value: 'WESTERN', label: '양식' },
    { value: 'ASIAN', label: '아시안' },
    { value: 'DESSERT', label: '디저트' },
    { value: 'BAKERY', label: '베이커리' },
    { value: 'SNACK', label: '간식' },
    { value: 'DRINK', label: '음료/술' },
];

// 난이도 상수 정의
const DIFFICULTY_OPTIONS = [
    { value: 'EASY', label: '쉬움' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'HARD', label: '어려움' },
];

// 재료 카테고리 상수 정의
const INGREDIENT_CATEGORIES = [
    { key: 'ALL', name: '전체' },
    { key: 'MEAT', name: '육류' },
    { key: 'VEGETABLE', name: '채소' },
    { key: 'FRUIT', name: '과일' },
    { key: 'DAIRY', name: '유제품' },
    { key: 'SEASONING', name: '조미료' },
    { key: 'FROZEN', name: '냉동' },
];

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
    const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('ALL');
    const [currentIngredientIndex, setCurrentIngredientIndex] = useState(0);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState(false);

    const scrollRef = useRef<KeyboardAwareScrollView>(null);
    const savedScrollPosition = useRef<number>(0);
    const currentStepIndex = useRef<number>(-1);

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

    const fetchModalIngredients = async (keyword: string, category: string) => {
        setModalLoading(true);
        try {
            const params: any = {
                keyword: keyword || undefined,
                category: category !== 'ALL' ? category : undefined,
            };
            const response = await axiosInstance.get('/api/ingredients', { params });
            if (response.data.isSuccess) setModalResults(response.data.result.ingredients);
        } catch (error) { console.error("Ingredient search error:", error); }
        finally { setModalLoading(false); }
    };

    const debouncedSearch = useCallback(debounce((keyword: string, category: string) => fetchModalIngredients(keyword, category), 300), []);

    const openIngredientModal = (index: number) => {
        setCurrentIngredientIndex(index);
        setModalSearchQuery('');
        setModalCategoryFilter('ALL');
        setModalResults([]);
        setIsModalVisible(true);
        fetchModalIngredients('', 'ALL');
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
            // step 이미지 업로드 시 현재 스크롤 위치 저장
            if (type === 'step' && index !== undefined) {
                currentStepIndex.current = index;
                // 현재 스크롤 위치 저장
                const scrollView = scrollRef.current?.getScrollResponder?.();
                if (scrollView && typeof scrollView.scrollTo === 'function') {
                    savedScrollPosition.current = scrollView.contentOffset?.y || 0;
                }
            }

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
                Alert.alert('성공', '이미지가 업로드되었습니다.');
            } else if (type === 'step' && index !== undefined) {
                const newSteps = [...steps];
                newSteps[index].imageUrl = imageUrl;
                setSteps(newSteps);
                // step 이미지는 화면에 바로 표시되므로 Alert 생략

                // 스크롤 위치 복원
                setTimeout(() => {
                    if (scrollRef.current && savedScrollPosition.current > 0) {
                        scrollRef.current.scrollToPosition(0, savedScrollPosition.current, true);
                    }
                }, 300);
            }
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
        if (!title || !time || !difficulty || !servings || !description || ingredients.some(i => !i.ingredientId) || steps.some(s => !s.description)) {
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
                // extraScrollHeight를 더 크게 설정하여 키보드가 입력창을 가리지 않도록 함
                scrollRef.current?.scrollToFocusedInput(node, 200, 0);
            }, 150);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: '레시피 등록',
                    headerBackTitle: '레시피 목록',
                    // ✅ 1. headerRight 부분을 수정합니다.
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleCreateRecipe}
                            disabled={isSubmitting}
                            // ✅ 2. 버튼 자체에 정렬 및 여백 스타일을 적용합니다.
                            style={styles.headerRightButton}
                        >
                            {isSubmitting ? (
                                // ✅ 3. ActivityIndicator에서 개별 스타일을 제거합니다.
                                <ActivityIndicator color="#007AFF" />
                            ) : (
                                <Text style={styles.headerSubmitButtonText}>등록</Text>
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />

            <KeyboardAwareScrollView
                ref={scrollRef}
                style={styles.flexContainer}
                contentContainerStyle={styles.scrollContainer}
                extraScrollHeight={150}
                enableOnAndroid={true}
                keyboardShouldPersistTaps="handled"
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

                <Text style={styles.label}>카테고리</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScrollContainer}
                    style={styles.categoryScrollView}
                >
                    {RECIPE_CATEGORIES.map((category) => (
                        <TouchableOpacity
                            key={category.value}
                            style={[
                                styles.categoryButton,
                                recipeCategory === category.value && styles.activeCategoryButton
                            ]}
                            onPress={() => setRecipeCategory(category.value)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    recipeCategory === category.value && styles.activeCategoryText
                                ]}
                            >
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

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
                        <View>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)}
                            >
                                <Text style={styles.dropdownButtonText}>
                                    {DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty)?.label || '선택'}
                                </Text>
                                <Ionicons
                                    name={isDifficultyDropdownOpen ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#888"
                                />
                            </TouchableOpacity>
                            {isDifficultyDropdownOpen && (
                                <View style={styles.dropdownList}>
                                    {DIFFICULTY_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setDifficulty(option.value);
                                                setIsDifficultyDropdownOpen(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.dropdownItemText,
                                                    difficulty === option.value && styles.dropdownItemTextActive
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                            {difficulty === option.value && (
                                                <Ionicons name="checkmark" size={20} color="#1298FF" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
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
                transparent={false}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <SafeAreaView style={styles.modalFullContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>재료 검색</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.modalSearchContainer}>
                        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.modalFullSearchInput}
                            placeholder="재료 이름 검색..."
                            value={modalSearchQuery}
                            onChangeText={(text) => {
                                setModalSearchQuery(text);
                                debouncedSearch(text, modalCategoryFilter);
                            }}
                        />
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.modalCategoryScrollContainer}
                        style={styles.modalCategoryScrollView}
                    >
                        {INGREDIENT_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.key}
                                style={[
                                    styles.modalCategoryButton,
                                    modalCategoryFilter === cat.key && styles.modalCategoryButtonActive
                                ]}
                                onPress={() => {
                                    setModalCategoryFilter(cat.key);
                                    fetchModalIngredients(modalSearchQuery, cat.key);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalCategoryButtonText,
                                        modalCategoryFilter === cat.key && styles.modalCategoryButtonTextActive
                                    ]}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {modalLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={modalResults}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={4}
                            contentContainerStyle={styles.modalGridContainer}
                            columnWrapperStyle={styles.modalGridRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalGridItem}
                                    onPress={() => onSelectIngredient(item)}
                                >
                                    <Image
                                        source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/JustFridge_logo.png')}
                                        style={styles.modalGridImage}
                                    />
                                    <Text style={styles.modalGridItemText} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                !modalLoading ? (
                                    <Text style={styles.modalEmptyText}>검색 결과가 없습니다.</Text>
                                ) : null
                            }
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    flexContainer: { flex: 1 },
    // ✅ 5. '등록' 버튼을 감싸는 컨테이너 스타일
    headerRightButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16, // 오른쪽 여백

    },
    headerSubmitButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
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
        borderBottomWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    row: { flexDirection: 'row', gap: 16 },
    flexInput: { flex: 1 },
    // 카테고리 버튼 스타일
    categoryScrollView: {
        marginBottom: 16,
    },
    categoryScrollContainer: {
        paddingVertical: 4,
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeCategoryButton: {
        backgroundColor: '#1298FF',
    },
    categoryText: {
        fontSize: 14,
        color: '#555',
    },
    activeCategoryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 24 },
    addButton: { flexDirection: 'row', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
    addButtonText: { color: '#555', fontWeight: '500', marginLeft: 4, fontSize: 15 },
    stepContainer: { flexDirection: 'row', marginBottom: 20, gap: 12, alignItems: 'flex-start' },
    stepNumber: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', paddingTop: 10 },
    stepContentWrapper: { flex: 1 },
    stepContent: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', alignItems: 'flex-end', },
    stepInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
    stepImagePicker: { padding: 10 },
    stepImagePreviewContainer: { marginTop: 12, position: 'relative', width: '100%', height: 150, borderRadius: 8, overflow: 'hidden' },
    stepImagePreview: { width: '100%', height: '100%', borderRadius: 8 },
    stepImageDeleteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 12, padding: 2 },
    deleteButton: { justifyContent: 'center', paddingLeft: 8, paddingTop: 10 },
    ingredientButton: { justifyContent: 'center', paddingVertical: 12 },
    ingredientText: { fontSize: 16, color: '#000' },
    ingredientPlaceholder: { fontSize: 16, color: '#c7c7cd' },
    // 드롭다운 스타일
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 12,
        marginBottom: 16,
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#000',
    },
    dropdownList: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#000',
    },
    dropdownItemTextActive: {
        color: '#1298FF',
        fontWeight: '600',
    },
    // --- Modal Styles ---
    modalFullContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        margin: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },
    modalFullSearchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    modalCategoryScrollView: {
        flexGrow: 0,
        flexShrink: 0,
    },
    modalCategoryScrollContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    modalCategoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCategoryButtonActive: {
        backgroundColor: '#1298FF',
    },
    modalCategoryButtonText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 16,
    },
    modalCategoryButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalGridContainer: {
        paddingHorizontal: 12,
    },
    modalGridRow: {
        justifyContent: 'flex-start',
        paddingHorizontal: 4,
    },
    modalGridItem: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        marginBottom: 12,
        marginHorizontal: 6,
    },
    modalGridImage: {
        width: 48,
        height: 48,
        backgroundColor: 'transparent',
        marginBottom: 4,
        resizeMode: 'contain',
    },
    modalGridItemText: {
        fontSize: 13,
        textAlign: 'center',
        color: '#333',
        width: '100%',
    },
    modalEmptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#888',
        fontSize: 16,
    },
});