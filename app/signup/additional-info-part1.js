import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../../api/axiosInstance';
import useSignupStore from '../../store/authStore';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';

export default function AdditionalInfoPart1Screen() {
    const router = useRouter();
    const { setAdditionalInfo1 } = useSignupStore();
    const [nickname, setNickname] = useState('');

    const [isCheckingNickname, setIsCheckingNickname] = useState(false);
    const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
    const [nicknameError, setNicknameError] = useState('');

    const handleNicknameChange = (text) => {
        setNickname(text);
        setIsNicknameAvailable(false); // 닉네임 변경 시 확인 상태 초기화
        const regex = /^[가-힣a-zA-Z0-9_-]{2,20}$/;
        if (!text) {
            setNicknameError('');
            return;
        }
        if (!regex.test(text)) {
            setNicknameError('2-20자, 한글/영문/숫자/-/_ 만 사용 가능합니다.');
        } else {
            debouncedCheckNickname(text);
        }
    };

    const checkNicknameAvailability = async (nicknameToCheck) => {
        if (!nicknameToCheck) return;

        setIsCheckingNickname(true);
        setNicknameError('');

        try {
            const response = await axiosInstance.get(`/api/auth/check-nickname?nickname=${nicknameToCheck}`);
            if (response.data.isSuccess) {
                setIsNicknameAvailable(true);
            } else {
                setNicknameError(response.data.message || '사용할 수 없는 닉네임입니다.');
            }
        } catch (error) {
            setNicknameError(error.response?.data?.message || '닉네임 확인 중 오류 발생');
        } finally {
            setIsCheckingNickname(false);
        }
    };

    const debouncedCheckNickname = useCallback(debounce(checkNicknameAvailability, 500), []);


    const handleNext = () => {
        if (!isNicknameAvailable) {
            Alert.alert('닉네임 중복 확인', '사용 가능한 닉네임인지 확인해주세요.');
            return;
        }
        setAdditionalInfo1(nickname, null); // 현재 프로필 이미지는 null
        router.push('/signup/additional-info-part2');
    };

    const handleImagePicker = () => {
        Alert.alert("준비 중", "프로필 사진 변경 기능은 준비 중입니다.");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>프로필을{"\n"}설정해주세요.</Text>

                <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePicker}>
                    <Image
                        source={require('../../assets/images/JustFridge_logo.png')}
                        style={styles.profileImage}
                    />
                    <View style={styles.cameraIconContainer}>
                        <Ionicons name="camera" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>

                <Text style={styles.label}>닉네임</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="2-20자, 한글/영문/숫자/-/_"
                        value={nickname}
                        onChangeText={handleNicknameChange}
                    />
                    {isCheckingNickname && <ActivityIndicator style={{ marginLeft: 10 }} />}
                </View>
                {nicknameError ? <Text style={styles.errorText}>{nicknameError}</Text> : (isNicknameAvailable && <Text style={styles.successText}>사용 가능한 닉네임입니다.</Text>)}

                <TouchableOpacity style={[styles.button, !isNicknameAvailable && styles.buttonDisabled]} onPress={handleNext} disabled={!isNicknameAvailable}>
                    <Text style={styles.buttonText}>다음</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, paddingHorizontal: 30, paddingTop: 60, },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, lineHeight: 36, },
    profileImageContainer: { alignSelf: 'center', marginBottom: 40, position: 'relative' },
    profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: '#E0E0E0' },
    cameraIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1298FF', padding: 8, borderRadius: 15 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    input: { flex: 1, height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 5 },
    button: { width: '100%', height: 50, backgroundColor: '#1298FF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 20, },
    buttonDisabled: { backgroundColor: '#A9A9A9' },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: 'red', alignSelf: 'flex-start', marginLeft: 5, marginBottom: 10, fontSize: 12 },
    successText: { color: 'green', alignSelf: 'flex-start', marginLeft: 5, marginBottom: 10, fontSize: 12, },
});