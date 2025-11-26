// app/(tabs)/community.tsx

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
    Alert,
    ImageSourcePropType
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 메뉴 데이터 정의
// 💡 추후 여기에 실제 이미지 경로를 require(...)로 넣어주시면 됩니다.
const MENU_ITEMS = [
    {
        id: 'tips',
        title: '꿀팁',
        subtitle: '여러가지 팁을 공유해요!',
        // 임시 배경색 (이미지가 없을 때 보임). 이미지를 넣으면 이 색은 가려집니다.
        tempColor: '#B45F06',
        // 👇 여기에 이미지를 넣으세요. 예: require('../../assets/images/tips_bg.png')
        image: require('../../assets/icons/tip_component.png'),
    },
    {
        id: 'ranking',
        title: '랭킹',
        subtitle: '요리왕은 누구일까요?',
        tempColor: '#4285F4',
        image: require('../../assets/icons/ranking_component.png'),
    },
    {
        id: 'qna',
        title: '질문방',
        subtitle: '무엇이든 물어보세요!',
        tempColor: '#7B61FF',
        image: require('../../assets/icons/question_component.png'),
    },
    {
        id: 'contest',
        title: '요리 경진 대회',
        subtitle: '여러분의 요리 실력을 뽐내보세요!',
        tempColor: '#D63384',
        image: require('../../assets/icons/contest_component.png'),
    },
];

export default function CommunityScreen() {
    const router = useRouter(); // ✅ 1. 라우터 훅 사용

    // ✅ 2. handlePress 함수 수정 (menuTitle 대신 id를 받도록 변경 추천)
    const handlePress = (itemId: string) => {
        if (itemId === 'ranking') {
            // 랭킹 페이지로 이동 (app/community/ranking.tsx)
            router.push('/community/ranking');
        } else {
            // 다른 메뉴는 아직 준비 중 알림
            Alert.alert("알림", "준비 중인 기능입니다.");
            console.log(`${itemId} 버튼이 눌렸습니다.`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>커뮤니티</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {MENU_ITEMS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7} // 눌렀을 때 투명해지는 정도 (클릭감)
                        // ✅ 3. onPress에서 item.id를 넘겨주도록 수정
                        onPress={() => handlePress(item.id)}
                        style={[styles.cardContainer, { backgroundColor: item.image ? 'transparent' : item.tempColor }]}
                    >
                        <ImageBackground
                            source={item.image as ImageSourcePropType}
                            style={styles.cardBackground}
                            imageStyle={{ borderRadius: 16 }} // 이미지 자체의 둥근 모서리
                            resizeMode="cover"
                        >
                            {/* 텍스트 가독성을 위한 얇은 오버레이 (필요 시 opacity 조절) */}
                            <View style={styles.textOverlay}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    cardContainer: {
        width: '100%',
        height: 140, // 카드 높이
        marginBottom: 20,
        borderRadius: 16,

        // 그림자 설정 (iOS)
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        // 그림자 설정 (Android)
        elevation: 5,
    },
    cardBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textOverlay: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)', // 이미지가 밝을 경우 글씨가 잘 보이도록 반투명 검정 배경
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#F0F0F0',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});