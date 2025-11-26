// src/features/member-refrigerator/styles.ts
import { StyleSheet,Dimensions } from 'react-native';
import Constants from 'expo-constants';

const { width: screenWidth } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2D303A',
    },
    summaryLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // [Header Styles - 기존 유지]
    header: {
        height: 126 + Constants.statusBarHeight,
        borderBottomWidth: 2,
        borderBottomColor: '#2D303A',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        shadowColor: '#070251',
        shadowOffset: { width: -2, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10,
        paddingTop: 15 + Constants.statusBarHeight,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 30,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 15,
    },
    tabButton: {
        width: 100,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTabBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTabBackgroundImageStyle: {
        borderRadius: 12,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#161616',
    },
    activeTabText: {
        fontWeight: '700',
    },

    // --- [요약 카드 스타일 수정] ---
    contentArea: {
        flex: 1,
        paddingBottom: 86,
    },
    summaryCardWrapper: {
        flex: 1,
    },
    summaryWrapper: {
        width: '100%',
        paddingTop: 60,
        alignItems: 'center', // ✅ 카드를 화면 정중앙에 위치시킴 (핵심)
    },
    summaryCard: {
        // ✅ 너비를 화면 너비에서 양옆 여백(30*2 = 60)을 뺀 값으로 고정
        width: screenWidth - 60,
        minHeight: 180,
        borderRadius: 16,
        overflow: 'hidden',
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    summaryCardImage: {
        borderRadius: 16,
        resizeMode: 'stretch',
    },

    // 1. 닉네임 영역
    nicknameContainer: {
        marginBottom: 24, // 간격 넓힘
    },
    nickname: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'left',
    },
    nicknameSuffix: {
        fontSize: 18,
        fontWeight: 'normal',
    },

    // 2. 프로필 + 스탯 가로 배치
    profileStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 40, // ✅ 추가: [프로필 이미지]와 [스탯] 사이의 간격을 여기서 일괄 조정
    },
    profileImage: {
        width: 74, // 이미지 살짝 키움
        height: 74,
        borderRadius: 37,
        backgroundColor: '#eee',
    },

    // 3. 스탯 (레시피, 팔로워, 팔로우)
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 40, // ✅ 스탯 사이 간격 조정
    },
    statItem: {
        alignItems: 'center',
    },
    // [수정] 숫자 크기 대폭 확대
    statValue: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 24, // 20 -> 24
        marginBottom: 4,
    },
    // [수정] 라벨 크기 확대
    statLabel: {
        color: '#DDDDDD',
        fontSize: 16, // 15 -> 16
        fontWeight: '600', // 굵기 살짝 추가
    },

    // 4. 랭킹 (우측 하단)
    rankingBox: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // 오른쪽 정렬
        alignItems: 'center',
        marginTop: 10,
        width: '100%', // 박스 너비 확보
    },
    rankingLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        marginRight: 8,
        textAlign: 'right',
    },
    // [수정] 랭킹 텍스트 잘림 방지 및 색상 유지
    rankingValue: {
        color: '#5FE5FF',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'right', // 오른쪽 정렬
    },
});