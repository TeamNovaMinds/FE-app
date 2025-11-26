// app/settings.tsx

import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Switch,
    Alert,
    ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen() {
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const logout = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        try {
            logout();
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            router.replace('/');
        } catch (error) {
            console.error("로그아웃 실패:", error);
            Alert.alert("로그아웃 중 오류가 발생했습니다.");
        }
    };

    const handleWithdraw = () => {
        // TODO: 회원 탈퇴 API 연동 필요
        Alert.alert(
            "회원 탈퇴",
            "정말로 탈퇴하시겠습니까? 모든 정보가 영구히 삭제됩니다.",
            [
                { text: "취소", style: "cancel" },
                { text: "탈퇴하기", style: "destructive", onPress: () => console.log("회원 탈퇴 처리") }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* 계정 설정 */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>계정 설정</Text>
                    <Link href="/settings/account-info" asChild>
                        <TouchableOpacity style={styles.listItem}>
                            <Text style={styles.listText}>계정 정보 수정</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>
                    <Link href="/settings/change-password" asChild>
                        <TouchableOpacity style={styles.listItem}>
                            <Text style={styles.listText}>비밀번호 변경</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* 앱 설정 */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>앱 설정</Text>
                    <View style={styles.listItem}>
                        <Text style={styles.listText}>알림 설정</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#007AFF" }}
                            thumbColor={"#f4f3f4"}
                            onValueChange={setNotificationsEnabled}
                            value={notificationsEnabled}
                        />
                    </View>
                </View>

                {/* ✅ '내 활동' 섹션 (요청 항목 추가) */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>내 활동</Text>
                    <Link href="/settings/point-history" asChild>
                        <TouchableOpacity style={styles.listItem}>
                            <Text style={styles.listText}>포인트 사용내역</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* 기타 */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>기타</Text>
                    <Link href="/skin" asChild>
                        <TouchableOpacity style={styles.listItem}>
                            <Text style={styles.listText}>스킨 라이브러리</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>
                    <Link href="/settings/privacy" asChild>
                        <TouchableOpacity style={styles.listItem}>
                            <Text style={styles.listText}>개인정보 처리방침</Text>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* 로그아웃 및 탈퇴 */}
                <View style={styles.listContainer}>
                    <TouchableOpacity style={styles.listItem} onPress={handleLogout}>
                        <Text style={styles.listText}>로그아웃</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.listItem} onPress={handleWithdraw}>
                        <Text style={[styles.listText, styles.dangerText]}>회원 탈퇴</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#888',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#f8f8f8',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    listContainer: {
        // 섹션 구분을 위해 유지
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginHorizontal: 24, // 좌우 여백
    },
    listText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    dangerText: {
        color: '#FF3B30',
    },
});