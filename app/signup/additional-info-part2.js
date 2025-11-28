import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView as NewSafeAreaView } from 'react-native-safe-area-context'; // 경고 메시지 해결
import axiosInstance from '../../api/axiosInstance';
import useSignupStore, { useAuthStore } from '../../store/authStore';
import { saveAuthData } from '../../utils/tokenStorage';
import { useQueryClient } from '@tanstack/react-query';

// --- 임시 하드코딩 데이터 ---
// ⚠️ 중요: 아이콘 이미지 파일을 assets/images 폴더에 추가해주세요!
const CATEGORIES = [
    { key: 'KOREAN', name: '한식', icon: require('../../assets/icons/korean.jpg') },
    { key: 'JAPANESE', name: '일식', icon: require('../../assets/icons/japan.png') },
    { key: 'CHINESE', name: '중식', icon: require('../../assets/icons/china.png') },
    { key: 'WESTERN', name: '양식', icon: require('../../assets/icons/west.png') },
    { key: 'ASIAN', name: '아시안', icon: require('../../assets/icons/asia.png') }, // '동양'으로 텍스트 변경
    { key: 'DESSERT', name: '디저트', icon: require('../../assets/icons/dessert.png') },
    { key: 'DRINK', name: '음료/술', icon: require('../../assets/icons/drink.png') },
    { key: 'BAKERY', name: '베이커리', icon: require('../../assets/icons/bread.png') },
    { key: 'SNACK', name: '간식', icon: require('../../assets/icons/snack.png') },

    // 필요시 다른 카테고리 추가
];

export default function AdditionalInfoPart2Screen() {
    const router = useRouter();
    const store = useSignupStore();
    const { login } = useAuthStore();
    const queryClient = useQueryClient();

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

            console.log('=== 회원가입 시작 ===');
            console.log('모든 정보 한 번에 전송:', {
                email,
                name,
                nickname,
                profileImgUrl,
                interestCategories: selected
            });

            // 모든 정보를 한 번에 전송
            const response = await axiosInstance.post('/api/auth/signup', {
                email,
                password,
                name,
                nickname,
                profileImgUrl: profileImgUrl || '',
                interestCategories: selected
            });

            console.log('회원가입 응답:', response.data);

            // 회원가입 완료 시 토큰 저장
            if (response.data.isSuccess) {
                const { accessToken, refreshToken, nickname: resNickname, name: resName, profileImg, profileCompleted } = response.data.result;

                console.log('회원가입 성공! 토큰 저장 중...');

                // React Query 캐시 초기화 (이전 사용자 데이터 제거)
                queryClient.clear();

                // 토큰과 사용자 정보 저장
                await saveAuthData(accessToken, refreshToken, {
                    nickname: resNickname,
                    name: resName,
                    email,
                    profileImg,
                    profileCompleted
                });

                // 로그인 상태 업데이트
                login({ nickname: resNickname, name: resName, email, profileImg, profileCompleted });

                Alert.alert("회원가입 완료!", `${resNickname}님 환영합니다!`);
                store.reset();
                router.replace('/home');
            } else {
                throw new Error(response.data.message || '회원가입 실패');
            }
        } catch (error) {
            console.error('회원가입 에러 상세:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

            const errorMessage = error.response?.data?.message || error.message || '요청 중 문제가 발생했습니다.';
            Alert.alert('회원가입 오류', errorMessage);
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <NewSafeAreaView style={styles.safeArea}>
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
        borderColor: '#1298FF',
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
        color: '#1298FF',
    },
    button: {
        width: '100%',
        height: 48,
        backgroundColor: '#1298FF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    buttonDisabled: { backgroundColor: '#A9A9A9' },
    buttonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '500' },
});