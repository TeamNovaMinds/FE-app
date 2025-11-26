// src/features/member-refrigerator/styles.ts
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

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
    contentArea: {
        flex: 1,
        paddingBottom: 86,
    },
    summaryCardWrapper: {
        flex: 1,
    },
    summaryWrapper: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    summaryCard: {
        width: '100%',
        minHeight: 180,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 20,
        justifyContent: 'center',
    },
    summaryCardImage: {
        borderRadius: 16,
        resizeMode: 'stretch',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    nickname: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    statLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 4,
    },
    rankingBox: {
        marginTop: 18,
        alignItems: 'center',
    },
    rankingLabel: {
        color: '#FFFFFF',
        fontSize: 15,
    },
    rankingValue: {
        color: '#5FE5FF',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
});
