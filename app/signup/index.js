import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
    const router = useRouter();
    const [agreements, setAgreements] = useState({
        termsOfService: false,
        privacyPolicy: false,
        ageConfirm: false,
    });

    const handleToggle = (key) => {
        setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSelectAll = () => {
        const allAgreed = Object.values(agreements).every(v => v);
        setAgreements({
            termsOfService: !allAgreed,
            privacyPolicy: !allAgreed,
            ageConfirm: !allAgreed,
        });
    };

    const handleNext = () => {
        if (Object.values(agreements).every(v => v)) {
            router.push('/signup/basic-info');
        } else {
            Alert.alert('약관 동의 필요', '모든 약관에 동의해야 회원가입을 진행할 수 있습니다.');
        }
    };

    const allAgreed = Object.values(agreements).every(v => v);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>서비스 이용약관에{"\n"}동의해주세요.</Text>

                <TouchableOpacity style={styles.agreementRow} onPress={handleSelectAll}>
                    <Ionicons name={allAgreed ? "checkbox" : "checkbox-outline"} size={24} color={allAgreed ? "#1298FF" : "#A9A9A9"} />
                    <Text style={[styles.agreementText, styles.bold]}>전체 동의</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.agreementRow} onPress={() => handleToggle('termsOfService')}>
                    <Ionicons name={agreements.termsOfService ? "checkbox" : "checkbox-outline"} size={24} color={agreements.termsOfService ? "#1298FF" : "#A9A9A9"} />
                    <Text style={styles.agreementText}>서비스 이용약관 (필수)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.agreementRow} onPress={() => handleToggle('privacyPolicy')}>
                    <Ionicons name={agreements.privacyPolicy ? "checkbox" : "checkbox-outline"} size={24} color={agreements.privacyPolicy ? "#1298FF" : "#A9A9A9"} />
                    <Text style={styles.agreementText}>개인정보 처리방침 (필수)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.agreementRow} onPress={() => handleToggle('ageConfirm')}>
                    <Ionicons name={agreements.ageConfirm ? "checkbox" : "checkbox-outline"} size={24} color={agreements.ageConfirm ? "#1298FF" : "#A9A9A9"} />
                    <Text style={styles.agreementText}>만 14세 이상 확인 (필수)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, !allAgreed && styles.buttonDisabled]} onPress={handleNext} disabled={!allAgreed}>
                    <Text style={styles.buttonText}>다음</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, paddingHorizontal: 30, paddingTop: 60 },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, lineHeight: 36 },
    agreementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    agreementText: { marginLeft: 12, fontSize: 16 },
    bold: { fontWeight: 'bold' },
    separator: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10, marginBottom: 20 },
    button: { width: '100%', height: 50, backgroundColor: '#3498db', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
    buttonDisabled: { backgroundColor: '#A9A9A9' },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});