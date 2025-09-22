import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView as NewSafeAreaView } from 'react-native-safe-area-context'; // 경고 메시지 해결
import axiosInstance from '../../api/axiosInstance';
import useSignupStore from '../../store/authStore';

// --- 임시 하드코딩 데이터 ---
// ⚠️ 중요: 아이콘 이미지 파일을 assets/images 폴더에 추가해주세요!
const CATEGORIES = [
    { key: 'KOREAN', name: '한식', icon: require('../../assets/images/logo.png') },
    { key: 'JAPANESE', name: '일식', icon: require('../../assets/images/logo.png') },
    { key: 'CHINESE', name: '중식', icon: require('../../assets/images/logo.png') },
    { key: 'WESTERN', name: '양식', icon: require('../../assets/images/logo.png') },
    { key: 'ASIAN', name: '동양', icon: require('../../assets/images/logo.png') }, // '동양'으로 텍스트 변경
    { key: 'SNACK', name: '분식', icon: require('../../assets/images/logo.png') }, // '분식'으로 텍스트 변경
    { key: 'HEALTHY', name: '건강식', icon: require('../../assets/images/logo.png') },
    { key: 'HOMEMADE', name: '혼밥', icon: require('../../assets/images/logo.png') },
    { key: 'VEGETABLES', name: '채소류', icon: require('../../assets/images/logo.png') },
    { key: 'CHICKEN', name: '치킨', icon: require('../../assets/images/logo.png') },
    { key: 'DUMPLING', name: '덮밥류', icon: require('../../assets/images/logo.png') },
    { key: 'DESSERT', name: '디저트', icon: require('../../assets/images/logo.png') },
    // 필요시 다른 카테고리 추가
];

export default function AdditionalInfoPart2Screen() {
    const router = useRouter();
    const store = useSignupStore();

    const [selected, setSelected] = useState([]);
    const [isSigningUp, setIsSigningUp] = useState(false);

    // API 호출 로직이 제거되었으므로 useEffect는 필요 없습니다.

    const handleSelect = (categoryKey) => {
        if (selected.includes(categoryKey)) {
            setSelected(prev => prev.filter(item => item !== categoryKey));
        } else if (selected.length < 3) {
            setSelected(prev => [...prev, categoryKey]);
        } else {
            Alert.alert("최대 3개까지 선택 가능합니다.");
        }
    };

    const handleSignup = async () => {
        if (selected.length === 0) {
            Alert.alert("관심사를 1개 이상 선택해주세요.");
            return;
        }

        setIsSigningUp(true);
        try {
            store.setInterestCategories(selected);
            const { email, password, name, nickname, profileImgUrl } = store;

            await axiosInstance.post('/api/auth/signup', { email, password, name });
            await axiosInstance.post('/api/auth/additional-info-part1', { nickname, profileImgUrl });
            await axiosInstance.post('/api/auth/additional-info-part2', { interestCategories: selected });

            Alert.alert("회원가입 완료!", `${store.nickname}님 환영합니다!`);
            store.reset();
            router.replace('/home');
        } catch (error) {
            const errorMessage = error.response?.data?.message || '요청 중 문제가 발생했습니다.';
            Alert.alert('회원가입 오류', errorMessage);
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <NewSafeAreaView style={styles.safeArea}>
            {/* --- 헤더 --- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#8F8F8F" />
                </TouchableOpacity>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { backgroundColor: '#E0E0E0' }]} />
                    <View style={[styles.progressBar, { backgroundColor: '#E0E0E0' }]} />
                    <View style={[styles.progressBar, { backgroundColor: '#5FE5FF' }]} />
                </View>
            </View>

            <View style={styles.container}>
                <Text style={styles.title}>관심 카테고리 설정</Text>
                <Text style={styles.subtitle}>최대 3개까지 선택할 수 있어요.</Text>

                <FlatList
                    data={CATEGORIES} // 하드코딩된 데이터 사용
                    renderItem={({ item }) => {
                        const isSelected = selected.includes(item.key);
                        return (
                            <TouchableOpacity
                                style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                                onPress={() => handleSelect(item.key)}
                            >
                                <Image source={item.icon} style={styles.categoryImage} />
                                <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    }}
                    keyExtractor={item => item.key}
                    numColumns={3}
                    contentContainerStyle={styles.listContentContainer}
                />

                <TouchableOpacity style={[styles.button, selected.length === 0 && styles.buttonDisabled]} onPress={handleSignup} disabled={selected.length === 0 || isSigningUp}>
                    {isSigningUp ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>가입하기</Text>}
                </TouchableOpacity>
            </View>
        </NewSafeAreaView>
    );
}

// --- 최종 디자인 스타일 ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderBottomWidth: 0.5,
        borderColor: '#D4D4D4',
    },
    backButton: {
        padding: 5,
    },
    progressBarContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end',
        gap: 8,
    },
    progressBar: {
        width: '25%',
        height: 2,
        borderRadius: 4,
    },
    container: { flex: 1, paddingHorizontal: 30, paddingTop: 30, },
    title: { fontSize: 20, fontWeight: '600', textAlign: 'center', color: '#161616', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#727272', textAlign: 'center', marginBottom: 30, },
    listContentContainer: {
        alignItems: 'center',
    },
    categoryItem: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
        borderRadius: 12,
        margin: 12,
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
        elevation: 3,
    },
    categoryItemSelected: {
        backgroundColor: '#E6F3FF',
        borderWidth: 2,
        borderColor: '#76C4FF',
    },
    categoryImage: {
        width: 44,
        height: 44,
        resizeMode: 'contain',
        marginBottom: 5,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#727272',
    },
    categoryNameSelected: {
        color: '#3498db',
    },
    button: {
        width: '100%',
        height: 48,
        backgroundColor: '#76C4FF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    buttonDisabled: { backgroundColor: '#A9A9A9' },
    buttonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '500' },
});