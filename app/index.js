import 'text-encoding';
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert,
    SafeAreaView, Image, TouchableOpacity
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest } from 'expo-auth-session';
// 💡 이제 axios 대신 우리가 만든 axiosInstance를 가져옵니다.
import axiosInstance from '../api/axiosInstance';
import { saveAuthData } from '../utils/tokenStorage';
import { useAuthStore } from '../store/authStore';

const redirectUri = 'justfridge://';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuthStore();

    const [googleRequest, googleResponse, promptAsyncGoogle] = useAuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER',
        redirectUri,
    }, { authorizationEndpoint: `${API_URL}/oauth2/authorization/google` });

    const [naverRequest, naverResponse, promptAsyncNaver] = useAuthRequest({
        clientId: 'YOUR_NAVER_CLIENT_ID_PLACEHOLDER',
        redirectUri,
    }, { authorizationEndpoint: `${API_URL}/oauth2/authorization/naver` });

    useEffect(() => {
        if (googleResponse?.type === 'success' || naverResponse?.type === 'success') {
            Alert.alert('로그인 성공!', '환영합니다!');
            router.replace('/home');
        }
    }, [googleResponse, naverResponse]);

    const handleEmailLogin = async () => {
        if (!email || !password) {
            Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            // 💡 axiosInstance를 사용하여 API 호출 (이제 baseURL을 적을 필요 없음)
            const response = await axiosInstance.post('/api/auth/login', {
                email: email,
                password: password,
            });

            if (response.data.isSuccess) {
                const { accessToken, refreshToken, nickname, name, profileImg, profileCompleted } = response.data.result;

                // 토큰과 사용자 정보 저장
                await saveAuthData(accessToken, refreshToken, {
                    nickname,
                    name,
                    email,
                    profileImg,
                    profileCompleted
                });

                // 로그인 상태 업데이트
                login({ nickname, name, email, profileImg, profileCompleted });

                Alert.alert('로그인 성공!', `${nickname}님, 환영합니다!`);
                router.replace('/home');
            } else {
                // 백엔드에서 보낸 에러 메시지를 그대로 사용
                Alert.alert('로그인 실패', response.data.message);
            }
        } catch (error) {
            // 서버 응답이 에러일 경우, 응답 본문에 담긴 메시지를 사용
            console.error('이메일 로그인 에러 상세:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                request: {
                    email: email,
                    passwordLength: password.length
                }
            });

            if (error.response && error.response.data && error.response.data.message) {
                Alert.alert('오류', `[${error.response.status}] ${error.response.data.message}`);
            } else {
                Alert.alert('오류', '로그인 중 문제가 발생했습니다.');
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Image source={require('../assets/images/JustFridge_logo.png')} style={styles.logo} />
                <TextInput style={styles.input} placeholder="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize='none' />
                <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
                <TouchableOpacity style={styles.loginButton} onPress={handleEmailLogin}>
                    <Text style={styles.loginButtonText}>로그인</Text>
                </TouchableOpacity>
                <View style={styles.linksContainer}>
                    <Link href="/signup" asChild><TouchableOpacity><Text style={styles.linkText}>회원가입</Text></TouchableOpacity></Link>
                    <Text style={styles.separator}>|</Text>
                    <Link href="/find-credentials" asChild><TouchableOpacity><Text style={styles.linkText}>아이디/비밀번호 찾기</Text></TouchableOpacity></Link>
                </View>
                <View style={styles.socialLoginContainer}>
                    <TouchableOpacity style={styles.socialIconButton} onPress={() => promptAsyncGoogle()}><Image source={require('../assets/images/google_logo.png')} style={styles.socialIcon} /></TouchableOpacity>
                    <TouchableOpacity style={[styles.socialIconButton, { backgroundColor: '#03C75A' }]} onPress={() => promptAsyncNaver()}><Image source={require('../assets/images/naver_logo.png')} style={styles.socialIcon} /></TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

// --- 스타일 (이전과 동일) ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center' },
    logo: { width: 400, height: 100, resizeMode: 'contain', marginBottom: 60 },
    input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 15, marginBottom: 12, fontSize: 16 },
    loginButton: { width: '100%', height: 50, backgroundColor: '#1298FF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    linksContainer: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
    linkText: { fontSize: 14, color: '#757575' },
    separator: { marginHorizontal: 10, color: '#E0E0E0' },
    socialLoginContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 40, },
    socialIconButton: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', marginHorizontal: 12, backgroundColor: '#FFFFFF', shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5, },
    socialIcon: { width: 32, height: 32, resizeMode: 'contain', },
});