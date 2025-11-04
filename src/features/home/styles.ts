import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2D303A',
    },
    headerGradient: {
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
    },
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15 + Constants.statusBarHeight,
        height: 30,
    },
    logoImage: {
        width: 150,
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
    // ImageBackground에 적용할 스타일 (새로 추가)
    activeTabBackground: {
        width: '100%', // 부모(tabButton)의 크기를 따름
        height: '100%', // 부모(tabButton)의 크기를 따름
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ImageBackground의 이미지 자체에 borderRadius를 적용 (새로 추가)
    activeTabBackgroundImageStyle: {
        borderRadius: 12, // tabButton과 동일한 값
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#161616',
    },
    activeTabText: {
        fontWeight: '700',
    },
    contentArea: {
        flex: 1,
        position: 'relative',
        paddingBottom: 86, // 하단 탭바 높이
        overflow: 'hidden',
    },
    animatedContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    contentGradient: { // 요약 뷰 (하늘색)
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#A2AECE',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        alignItems: 'center',
    },
    detailBackground: { // 상세 뷰 (이미지)
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: '#A2AECE',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        overflow: 'hidden',
    },
    // 요약 뷰 스타일
    countBoxWrapper: {
        marginTop: 58,
        width: '100%',
        alignItems: 'center',
    },
    countBox: {
        width: 299,
        height: 169,
        borderRadius: 12, // 삭제 (imageStyle로 이동)
        position: 'relative',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,

        // ImageBackground의 자식(countBoxContent)을 중앙 정렬하기 위해 추가
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ImageBackground의 이미지에 둥근 모서리를 적용하기 위해 새로 추가
    countBoxImageStyle: {
        borderRadius: 12,
    },

    countBoxContent: {
        paddingVertical: 34,
        paddingHorizontal: 24,
        width: '100%', // 텍스트가 올바르게 배치되도록 너비 100% 설정
    },
    countLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FCFCFC',
        textAlign: 'left',
    },
    countNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#89FFF1',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#2D303A',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF5C5C',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    retryButton: {
        backgroundColor: '#89FFF1',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#2D303A',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // 상세 뷰 (재료 목록) 스타일
    emptyContainer: { // '비었어요' 뷰
        paddingTop: 60,
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 28,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    emptyButton: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyButtonText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        paddingBottom: 450,
    },
    detailLoadingContainer: { // 목록 로딩
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailErrorContainer: { // 목록 에러
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    gridContainer: { // FlatList의 contentContainer
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    gridRow: { // FlatList의 columnWrapperStyle
        justifyContent: 'flex-start',
        paddingHorizontal: 4,
    },
    gridItem: { // 재료 아이템 (둥근 사각형)
        width: 90,
        height: 90,
        borderRadius: 16,
        backgroundColor: 'rgba(101, 104, 115, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        marginBottom: 12,
        marginHorizontal: 4,
    },
    gridItemImage: {
        width: 48,
        height: 48,
        resizeMode: 'contain',
    },
    gridItemText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
        marginTop: 4,
        textAlign: 'center',
    },
    // FAB 스타일
    fab: {
        position: 'absolute',
        bottom: 106,
        right: 20,
        zIndex: 5,
    },
    fabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabText: {
        color: '#000000',
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 16,
    },
    fabIcon: {
        width: 22,
        height: 22,
        resizeMode: 'contain',
    },
});