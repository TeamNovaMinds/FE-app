import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../../api/axiosInstance';
import useSignupStore from '../../store/authStore';

export default function BasicInfoScreen() {
    const router = useRouter();
    const { setBasicInfo } = useSignupStore();

    // 입력 값 상태
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');

    // 유효성 검사 및 API 상태
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isEmailChecked, setIsEmailChecked] = useState(false); // 중복 확인 버튼을 눌렀는지 여부
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // 이메일 입력값이 변경될 때마다, '확인 완료' 상태를 초기화
    const handleEmailChange = (text) => {
        setEmail(text);
        setIsEmailChecked(false); // 이메일이 변경되었으므로 다시 확인 필요
        setEmailError('');
    };

    // 이메일 유효성 검사
    const validateEmailFormat = (text) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(text);
    };

    // 비밀번호 유효성 검사
    const validatePassword = (text) => {
        const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
        if (!text) {
            setPasswordError('');
            return;
        }
        if (!regex.test(text)) {
            setPasswordError('8-16자, 문자/숫자/특수문자를 포함해야 합니다.');
        } else {
            setPasswordError('');
        }
    };

    // 비밀번호 확인
    const validateConfirmPassword = (text) => {
        if (!text || !password) {
            setConfirmPasswordError('');
            return;
        }
        if (text !== password) {
            setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
        } else {
            setConfirmPasswordError('');
        }
    };

    // [추가] 중복 확인 버튼 핸들러
    const handleCheckEmail = async () => {
        if (!validateEmailFormat(email)) {
            setEmailError('유효한 이메일 형식이 아닙니다.');
            return;
        }

        setIsCheckingEmail(true);
        setEmailError('');

        try {
            const response = await axiosInstance.get(`/api/auth/check-email?email=${email.trim()}`);
            if (response.data.isSuccess) {
                setIsEmailChecked(true); // 확인 완료 상태로 변경
                Alert.alert("사용 가능", "사용 가능한 이메일입니다.");
            } else {
                setEmailError(response.data.message || '사용할 수 없는 이메일입니다.');
                setIsEmailChecked(false);
            }
        } catch (error) {
            if (error.response?.data?.message) {
                setEmailError(error.response.data.message);
            } else {
                setEmailError('이메일 확인 중 오류가 발생했습니다.');
            }
            setIsEmailChecked(false);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleNext = () => {
        if (!isEmailChecked) {
            Alert.alert('이메일 중복 확인', '이메일 중복 확인을 먼저 진행해주세요.');
            return;
        }
        if (passwordError || confirmPasswordError || !name.trim() || !password || !confirmPassword) {
            Alert.alert('입력 오류', '모든 정보를 올바르게 입력해주세요.');
            return;
        }

        setBasicInfo(email.trim(), password, name.trim());
        router.push('/signup/additional-info-part1');
    };

    const isNextDisabled = !isEmailChecked || !!passwordError || !!confirmPasswordError || !name.trim() || !password || !confirmPassword;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>기본 정보를{"\n"}입력해주세요.</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.inputWithButton}
                        placeholder="이메일"
                        value={email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize='none'
                    />
                    <TouchableOpacity style={styles.checkButton} onPress={handleCheckEmail} disabled={isCheckingEmail}>
                        {isCheckingEmail ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkButtonText}>중복 확인</Text>}
                    </TouchableOpacity>
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : (isEmailChecked && <Text style={styles.successText}>사용 가능한 이메일입니다.</Text>)}

                {/* --- 나머지 입력 필드는 이전과 동일 --- */}
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    value={password}
                    onChangeText={(text) => { setPassword(text); validatePassword(text); validateConfirmPassword(confirmPassword); }}
                    secureTextEntry
                />
                {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

                <TextInput
                    style={styles.input}
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); validateConfirmPassword(text); }}
                    secureTextEntry
                />
                {confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}

                <TextInput
                    style={styles.input}
                    placeholder="이름"
                    value={name}
                    onChangeText={setName}
                />

                <TouchableOpacity style={[styles.button, isNextDisabled && styles.buttonDisabled]} onPress={handleNext} disabled={isNextDisabled}>
                    <Text style={styles.buttonText}>다음</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// [수정] 스타일 변경
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, paddingHorizontal: 30, paddingTop: 60 },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, lineHeight: 36 },
    inputContainer: { flexDirection: 'row', width: '100%', alignItems: 'center', marginBottom: 5 },
    input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 5 },
    inputWithButton: { flex: 1, height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginRight: 10 },
    checkButton: { height: 50, paddingHorizontal: 15, backgroundColor: '#555', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    checkButtonText: { color: '#fff', fontWeight: 'bold' },
    button: { width: '100%', height: 50, backgroundColor: '#1298FF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
    buttonDisabled: { backgroundColor: '#A9A9A9' },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: 'red', alignSelf: 'flex-start', marginLeft: 5, marginBottom: 10, fontSize: 12 },
    successText: { color: 'green', alignSelf: 'flex-start', marginLeft: 5, marginBottom: 10, fontSize: 12 },
});