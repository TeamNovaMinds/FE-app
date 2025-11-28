// app/member/[nickname]/refrigerator.tsx

import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageSourcePropType,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SvgImageBackground } from '@/components/SvgImageBackground';

import { IngredientListView } from '@/src/features/home/components/IngredientListView';
import { TAB_ACTIVE_COLORS } from '@/src/features/home/constants';
import { TabName } from '@/src/features/home/types';
import { useTabAnimation } from '@/src/features/home/hooks/useTabAnimation';
import { memberRefrigeratorService } from '@/src/features/member-refrigerator/service';
import { styles as memberStyles } from '@/src/features/member-refrigerator/styles';
import { styles as homeStyles } from '@/src/features/home/styles';
import { getImageSource, SKIN_ASSETS, SkinIdentifier } from '@/src/features/skin/skinAssets';
import { skinService } from '@/src/features/skin/service';
import ActiveTabBg from '../../../assets/icons/active_tab_bg.svg';
const defaultHeaderBackground = require('../../../assets/images/default.png');
const defaultDetailBackground = require('../../../assets/images/room.png');
const defaultSummaryBackground = require('../../../assets/images/default.png');
const summaryCardBackground = require('../../../assets/icons/others_summary_bg.png');

const MemberRefrigeratorScreen = () => {
    const { nickname: nicknameParam } = useLocalSearchParams<{ nickname: string }>();
    const nickname = Array.isArray(nicknameParam) ? nicknameParam[0] : nicknameParam;
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabName | null>(null);
    const queryClient = useQueryClient();

    const {
        summaryAnimatedStyle,
        fridgeDetailStyle,
        freezerDetailStyle,
        roomDetailStyle,
    } = useTabAnimation(activeTab);

    const {
        data: summary,
        isLoading: isSummaryLoading,
        error: summaryError,
    } = useQuery({
        queryKey: ['memberRefrigeratorSummary', nickname],
        queryFn: () => memberRefrigeratorService.getSummary(nickname!),
        enabled: Boolean(nickname),
        refetchOnMount: 'always', // 항상 최신 데이터 가져오기
    });

    const {
        data: storedItemsResponse,
        isLoading: isListLoading,
        error: listError,
    } = useQuery({
        queryKey: ['memberStoredIngredients', nickname, activeTab],
        queryFn: () => memberRefrigeratorService.getStoredItems(nickname!, activeTab!),
        enabled: Boolean(nickname && activeTab),
        staleTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    const equippedSkinId = summary?.equippedSkinId;

    const { data: skinShopData } = useQuery({
        queryKey: ['skinShop'],
        queryFn: () => skinService.getShopSkins(),
        staleTime: 1000 * 60 * 10,
    });

    const resolvedSkinImages = useMemo((): {
        backgroundImage: ImageSourcePropType;
        headerBackgroundImage: ImageSourcePropType;
        summaryBackgroundImage: ImageSourcePropType;
        fridgeBackgroundImage: ImageSourcePropType;
        freezerBackgroundImage: ImageSourcePropType;
        roomBackgroundImage: ImageSourcePropType;
    } => {
        if (equippedSkinId && skinShopData?.skins) {
            const equippedSkin = skinShopData.skins.find(skin => skin.id === equippedSkinId);

            if (equippedSkin?.thumbnailUrl) {
                const thumbnailUrl = equippedSkin.thumbnailUrl;

                if (!thumbnailUrl.startsWith('http')) {
                    const skinAsset = SKIN_ASSETS[thumbnailUrl as SkinIdentifier];
                    if (skinAsset) {
                        return {
                            backgroundImage: skinAsset.thumbnail,
                            headerBackgroundImage: skinAsset.headerBackground,
                            summaryBackgroundImage: skinAsset.summaryBackground,
                            fridgeBackgroundImage: skinAsset.fridgeBackground,
                            freezerBackgroundImage: skinAsset.freezerBackground,
                            roomBackgroundImage: skinAsset.roomBackground,
                        };
                    }
                }

                const source = getImageSource(thumbnailUrl);
                return {
                    backgroundImage: source,
                    headerBackgroundImage: source,
                    summaryBackgroundImage: source,
                    fridgeBackgroundImage: source,
                    freezerBackgroundImage: source,
                    roomBackgroundImage: source,
                };
            }
        }

        return {
            backgroundImage: defaultDetailBackground,
            headerBackgroundImage: defaultHeaderBackground,
            summaryBackgroundImage: defaultSummaryBackground,
            fridgeBackgroundImage: defaultDetailBackground,
            freezerBackgroundImage: defaultDetailBackground,
            roomBackgroundImage: defaultDetailBackground,
        };
    }, [equippedSkinId, skinShopData]);

    const storedIngredients = storedItemsResponse?.storedIngredients || [];
    const listErrorMessage = listError ? '재료를 불러오는 중 오류가 발생했습니다.' : null;
    const headerTitle = nickname ? `${nickname} 님 냉장고` : '타인 냉장고';

    const handleTabPress = (tabName: TabName) => {
        const newTab = activeTab === tabName ? null : tabName;
        setActiveTab(newTab);

        if (nickname && newTab) {
            queryClient.prefetchQuery({
                queryKey: ['memberStoredIngredients', nickname, newTab],
                queryFn: () => memberRefrigeratorService.getStoredItems(nickname, newTab),
            });
        }
    };

    return (
        <View style={homeStyles.container}>
            <SvgImageBackground
                source={resolvedSkinImages.headerBackgroundImage}
                style={homeStyles.headerGradient}
                resizeMode="cover"
            >
                <View style={homeStyles.logoContainer}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            position: 'absolute',
                            left: 16,
                            padding: 8,
                            zIndex: 10,
                        }}
                    >
                        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={homeStyles.headerTitle}>{headerTitle}</Text>
                </View>

                <View style={homeStyles.tabContainer}>
                    <TouchableOpacity
                        style={homeStyles.tabButton}
                        onPress={() => handleTabPress('fridge')}
                    >
                        {activeTab === 'fridge' ? (
                            <View style={homeStyles.activeTabBackground}>
                                <ActiveTabBg
                                    width="100%"
                                    height="100%"
                                    style={{ position: 'absolute' }}
                                    preserveAspectRatio="none"
                                />
                                <Text style={[
                                    homeStyles.tabText,
                                    homeStyles.activeTabText,
                                    { color: TAB_ACTIVE_COLORS.fridge }
                                ]}>
                                    냉장고
                                </Text>
                            </View>
                        ) : (
                            <Text style={homeStyles.tabText}>
                                냉장고
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={homeStyles.tabButton}
                        onPress={() => handleTabPress('freezer')}
                    >
                        {activeTab === 'freezer' ? (
                            <View style={homeStyles.activeTabBackground}>
                                <ActiveTabBg
                                    width="100%"
                                    height="100%"
                                    style={{ position: 'absolute' }}
                                    preserveAspectRatio="none"
                                />
                                <Text style={[
                                    homeStyles.tabText,
                                    homeStyles.activeTabText,
                                    { color: TAB_ACTIVE_COLORS.freezer }
                                ]}>
                                    냉동고
                                </Text>
                            </View>
                        ) : (
                            <Text style={homeStyles.tabText}>
                                냉동고
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={homeStyles.tabButton}
                        onPress={() => handleTabPress('room')}
                    >
                        {activeTab === 'room' ? (
                            <View style={homeStyles.activeTabBackground}>
                                <ActiveTabBg
                                    width="100%"
                                    height="100%"
                                    style={{ position: 'absolute' }}
                                    preserveAspectRatio="none"
                                />
                                <Text style={[
                                    homeStyles.tabText,
                                    homeStyles.activeTabText,
                                    { color: TAB_ACTIVE_COLORS.room }
                                ]}>
                                    실온
                                </Text>
                            </View>
                        ) : (
                            <Text style={homeStyles.tabText}>
                                실온
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SvgImageBackground>

            <View style={homeStyles.contentArea}>
                <Animated.View style={[homeStyles.animatedContainer, fridgeDetailStyle]}>
                    <SvgImageBackground
                        source={resolvedSkinImages.fridgeBackgroundImage}
                        style={homeStyles.detailBackground}
                        resizeMode="stretch"
                    >
                        <IngredientListView
                            isLoading={isListLoading}
                            error={listErrorMessage}
                            ingredients={storedIngredients}
                            tabName="fridge"
                            color={TAB_ACTIVE_COLORS.fridge}
                            readOnly
                        />
                    </SvgImageBackground>
                </Animated.View>

                <Animated.View style={[homeStyles.animatedContainer, freezerDetailStyle]}>
                    <SvgImageBackground
                        source={resolvedSkinImages.freezerBackgroundImage}
                        style={homeStyles.detailBackground}
                        resizeMode="stretch"
                    >
                        <IngredientListView
                            isLoading={isListLoading}
                            error={listErrorMessage}
                            ingredients={storedIngredients}
                            tabName="freezer"
                            color={TAB_ACTIVE_COLORS.freezer}
                            readOnly
                        />
                    </SvgImageBackground>
                </Animated.View>

                <Animated.View style={[homeStyles.animatedContainer, roomDetailStyle]}>
                    <SvgImageBackground
                        source={resolvedSkinImages.roomBackgroundImage}
                        style={homeStyles.detailBackground}
                        resizeMode="stretch"
                    >
                        <IngredientListView
                            isLoading={isListLoading}
                            error={listErrorMessage}
                            ingredients={storedIngredients}
                            tabName="room"
                            color={TAB_ACTIVE_COLORS.room}
                            readOnly
                        />
                    </SvgImageBackground>
                </Animated.View>

                <Animated.View style={[homeStyles.animatedContainer, summaryAnimatedStyle]}>
                    <SvgImageBackground
                        source={resolvedSkinImages.summaryBackgroundImage}
                        style={homeStyles.contentGradient}
                        resizeMode="cover"
                    >
                        <View style={memberStyles.summaryWrapper}>
                            <SvgImageBackground
                                source={summaryCardBackground}
                                style={memberStyles.summaryCard}
                                imageStyle={memberStyles.summaryCardImage}
                                resizeMode="cover"
                            >
                                {isSummaryLoading ? (
                                    <View style={memberStyles.summaryLoading}>
                                        <ActivityIndicator size="large" color="#5FE5FF" />
                                    </View>
                                ) : summaryError ? (
                                    <View style={memberStyles.summaryLoading}>
                                        <Text style={{ color: '#FF5C5C' }}>요약 정보를 불러오지 못했습니다.</Text>
                                    </View>
                                ) : (
                                    <>
                                        {/* 1. 닉네임 (맨 위) */}
                                        <View style={memberStyles.nicknameContainer}>
                                            <Text style={memberStyles.nickname}>
                                                {summary?.nickname || '알 수 없음'} <Text style={memberStyles.nicknameSuffix}>님</Text>
                                            </Text>
                                        </View>

                                        {/* 2. 프로필 이미지 + 스탯 (가로 배치) */}
                                        <View style={memberStyles.profileStatsRow}>
                                            {/* 왼쪽: 프로필 이미지 */}
                                            <Image
                                                source={summary?.profileImageUrl
                                                    ? { uri: summary.profileImageUrl }
                                                    : require('../../../assets/images/JustFridge_logo.png')}
                                                style={memberStyles.profileImage}
                                                contentFit="cover"
                                                transition={200}
                                                cachePolicy="memory-disk"
                                            />

                                            {/* 오른쪽: 스탯 (레시피, 팔로워, 팔로우) */}
                                            <View style={memberStyles.statRow}>
                                                <View style={memberStyles.statItem}>
                                                    <Text style={memberStyles.statValue}>{summary?.recipeCount ?? 0}</Text>
                                                    <Text style={memberStyles.statLabel}>레시피</Text>
                                                </View>
                                                <View style={memberStyles.statItem}>
                                                    <Text style={memberStyles.statValue}>{summary?.followerCount ?? 0}</Text>
                                                    <Text style={memberStyles.statLabel}>팔로워</Text>
                                                </View>
                                                <View style={memberStyles.statItem}>
                                                    <Text style={memberStyles.statValue}>{summary?.followingCount ?? 0}</Text>
                                                    <Text style={memberStyles.statLabel}>팔로우</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* 3. 포인트 랭킹 (우측 하단) */}
                                        <View style={memberStyles.rankingBox}>
                                            <Text style={memberStyles.rankingLabel}>포인트 랭킹</Text>
                                            <Text style={memberStyles.rankingValue}>
                                                {summary?.pointRanking ? `${summary.pointRanking}등` : '집계 중'}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </SvgImageBackground>
                        </View>
                    </SvgImageBackground>
                </Animated.View>
            </View>
        </View>
    );
};

export default MemberRefrigeratorScreen;