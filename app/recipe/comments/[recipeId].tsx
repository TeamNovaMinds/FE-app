// app/recipe/comments/[recipeId].tsx

import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    InfiniteData,
} from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { formatRelativeTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

// --- 1. 타입 정의 ---

// (src/features/recipe/types.ts의 AuthorInfo와 동일)
interface AuthorInfo {
    nickname: string;
    profileImageUrl: string | null;
    following?: boolean;
    myself?: boolean;
}

// 2계층 구조를 위한 타입 (대댓글)
interface Reply {
    commentId: number;
    content: string;
    authorInfo: AuthorInfo;
    writtenByMe: boolean;
    createdAt: string;
}

// 1계층 구조 (원본 댓글)
interface Comment extends Reply {
    replies: Reply[];
}

// API 응답 타입
interface CommentListResponse {
    comments: Comment[];
    hasNext: boolean;
    nextCursor: number | null;
}

// --- 2. API 호출 함수 ---

// 댓글 목록 (무한 스크롤)
const fetchComments = async ({
                                 pageParam,
                                 recipeId,
                             }: {
    pageParam: number | null;
    recipeId: string;
}) => {
    const response = await axiosInstance.get(`/api/recipes/${recipeId}/comments`, {
        params: {
            cursorId: pageParam,
            size: 20, // (페이지 당 20개)
        },
    });
    if (response.data.isSuccess) {
        return response.data.result as CommentListResponse;
    }
    throw new Error(response.data.message || '댓글을 불러오는 데 실패했습니다.');
};

// 댓글/대댓글 작성
const createComment = async ({
                                 recipeId,
                                 content,
                                 parentCommentId,
                             }: {
    recipeId: string;
    content: string;
    parentCommentId?: number | null;
}) => {
    const url = `/api/recipes/${recipeId}/comments`;
    const body = { content };
    const params = parentCommentId ? { parentCommentId } : {};

    const response = await axiosInstance.post(url, body, { params });
    if (response.data.isSuccess) {
        return response.data.result;
    }
    throw new Error(response.data.message || '댓글 작성에 실패했습니다.');
};

// 댓글 수정
const updateComment = async ({
                                 recipeId,
                                 commentId,
                                 content,
                             }: {
    recipeId: string;
    commentId: number;
    content: string;
}) => {
    const url = `/api/recipes/${recipeId}/comments/${commentId}`;
    const body = { content };

    const response = await axiosInstance.put(url, body);
    if (response.data.isSuccess) {
        return response.data.result;
    }
    throw new Error(response.data.message || '댓글 수정에 실패했습니다.');
};

// 댓글 삭제
const deleteComment = async ({
                                 recipeId,
                                 commentId,
                             }: {
    recipeId: string;
    commentId: number;
}) => {
    const url = `/api/recipes/${recipeId}/comments/${commentId}`;

    const response = await axiosInstance.delete(url);
    if (response.data.isSuccess) {
        return response.data.result;
    }
    throw new Error(response.data.message || '댓글 삭제에 실패했습니다.');
};

// --- 3. 댓글 아이템 컴포넌트 ---
interface CommentItemProps {
    item: Comment | Reply;
    isReply: boolean;
    onReplyPress: (commentId: number, nickname: string) => void;
    onEditPress: (commentId: number, content: string) => void;
    onDeletePress: (commentId: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
    item,
    isReply,
    onReplyPress,
    onEditPress,
    onDeletePress
}) => {

    const handleReply = () => {
        onReplyPress(item.commentId, item.authorInfo.nickname);
    };

    const handleEdit = () => {
        onEditPress(item.commentId, item.content);
    };

    const handleDelete = () => {
        onDeletePress(item.commentId);
    };

    return (
        <View style={[styles.commentItem, isReply && styles.replyItem]}>
            <Image
                source={item.authorInfo.profileImageUrl ? { uri: item.authorInfo.profileImageUrl } : require('../../../assets/images/JustFridge_logo.png')}
                style={styles.authorImage}
            />
            <View style={styles.commentContent}>
                <Text style={styles.authorName}>{item.authorInfo.nickname}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
                <View style={styles.commentFooter}>
                    <Text style={styles.commentDate}>{formatRelativeTime(item.createdAt)}</Text>
                    {/* 2계층까지만 허용: 대댓글(isReply=true)에는 '답글 달기' X */}
                    {!isReply && (
                        <TouchableOpacity onPress={handleReply}>
                            <Text style={styles.footerActionText}>답글 달기</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {item.writtenByMe && (
                    <View style={styles.myCommentActions}>
                        <TouchableOpacity onPress={handleEdit}>
                            <Text style={styles.footerActionText}>수정</Text>
                        </TouchableOpacity>
                        <Text style={styles.footerActionText}> | </Text>
                        <TouchableOpacity onPress={handleDelete}>
                            <Text style={styles.footerActionText}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

// --- 4. 메인 화면 컴포넌트 ---
export default function RecipeCommentsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const params = useLocalSearchParams();
    const recipeId = Array.isArray(params.recipeId) ? params.recipeId[0] : params.recipeId;

    const [content, setContent] = useState('');
    // { commentId: 부모 ID, nickname: 부모 닉네임 }
    const [replyTo, setReplyTo] = useState<{ commentId: number; nickname: string } | null>(null);
    // { commentId: 수정할 댓글 ID }
    const [editingComment, setEditingComment] = useState<{ commentId: number } | null>(null);

    const textInputRef = useRef<TextInput>(null);

    // 댓글 목록 (무한 스크롤)
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery<
        CommentListResponse,
        Error,
        InfiniteData<CommentListResponse>,
        (string | number | null)[],
        number | null
    >({
        queryKey: ['comments', recipeId],
        queryFn: ({ pageParam = null }) => fetchComments({ pageParam, recipeId: recipeId! }),
        initialPageParam: null,
        getNextPageParam: (lastPage) =>
            lastPage.hasNext ? lastPage.nextCursor : undefined,
    });

    // 댓글/대댓글 생성
    const createCommentMutation = useMutation({
        mutationFn: createComment,
        onSuccess: () => {
            // 성공 시, 댓글 목록과 레시피 상세 화면(미리보기) 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            setContent('');
            setReplyTo(null);
            Keyboard.dismiss();
        },
        onError: (err: any) => {
            Alert.alert('작성 실패', err.message || '댓글 작성 중 오류가 발생했습니다.');
        },
    });

    // 댓글 수정
    const updateCommentMutation = useMutation({
        mutationFn: updateComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            setContent('');
            setEditingComment(null);
            Keyboard.dismiss();
            Alert.alert('수정 완료', '댓글이 수정되었습니다.');
        },
        onError: (err: any) => {
            Alert.alert('수정 실패', err.message || '댓글 수정 중 오류가 발생했습니다.');
        },
    });

    // 댓글 삭제
    const deleteCommentMutation = useMutation({
        mutationFn: deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            Alert.alert('삭제 완료', '댓글이 삭제되었습니다.');
        },
        onError: (err: any) => {
            Alert.alert('삭제 실패', err.message || '댓글 삭제 중 오류가 발생했습니다.');
        },
    });

    // 전송 버튼 핸들러
    const handleSubmit = () => {
        if (!content.trim()) {
            Alert.alert('입력 오류', '댓글 내용을 입력해주세요.');
            return;
        }

        // 수정 모드일 때
        if (editingComment) {
            if (updateCommentMutation.isPending) return;
            updateCommentMutation.mutate({
                recipeId: recipeId!,
                commentId: editingComment.commentId,
                content: content.trim(),
            });
            return;
        }

        // 작성 모드일 때
        if (createCommentMutation.isPending) return;
        createCommentMutation.mutate({
            recipeId: recipeId!,
            content: content.trim(),
            parentCommentId: replyTo?.commentId,
        });
    };

    // '답글 달기' 클릭 핸들러
    const handleReplyPress = (commentId: number, nickname: string) => {
        setEditingComment(null); // 수정 모드 취소
        setContent(''); // 입력창 내용 초기화
        setReplyTo({ commentId, nickname });
        textInputRef.current?.focus();
    };

    // '수정' 클릭 핸들러
    const handleEditPress = (commentId: number, currentContent: string) => {
        setReplyTo(null); // 답글 모드 취소
        setEditingComment({ commentId });
        setContent(currentContent); // 기존 내용을 입력창에 채우기
        textInputRef.current?.focus();
    };

    // '삭제' 클릭 핸들러
    const handleDeletePress = (commentId: number) => {
        Alert.alert(
            '댓글 삭제',
            '정말로 이 댓글을 삭제하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => {
                        deleteCommentMutation.mutate({
                            recipeId: recipeId!,
                            commentId,
                        });
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // '대댓글' 상태 취소
    const cancelReply = () => {
        setReplyTo(null);
        Keyboard.dismiss();
    };

    // '수정' 상태 취소
    const cancelEdit = () => {
        setEditingComment(null);
        setContent('');
        Keyboard.dismiss();
    };

    // FlatList 렌더링용 데이터 가공
    const allComments = useMemo(
        () => data?.pages.flatMap((page) => page.comments) ?? [],
        [data]
    );

    // FlatList 렌더링 아이템 (1계층 + 2계층)
    const renderItem = useCallback(({ item }: { item: Comment }) => (
        <View>
            {/* 1계층 댓글 */}
            <CommentItem
                item={item}
                isReply={false}
                onReplyPress={handleReplyPress}
                onEditPress={handleEditPress}
                onDeletePress={handleDeletePress}
            />
            {/* 2계층 댓글 (대댓글) */}
            {item.replies && item.replies.length > 0 && (
                <View style={styles.replyListContainer}>
                    {item.replies.map((reply) => (
                        <CommentItem
                            key={reply.commentId}
                            item={reply}
                            isReply={true}
                            onReplyPress={() => {}} // 2계층은 답글 버튼 없음
                            onEditPress={handleEditPress}
                            onDeletePress={handleDeletePress}
                        />
                    ))}
                </View>
            )}
        </View>
    ), [handleReplyPress, handleEditPress, handleDeletePress]);

    // 로딩 / 에러 / 빈 화면 처리
    if (isLoading && !data) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error.message}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: '댓글 전체보기' }} />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0} // 헤더 높이만큼 조절
            >
                <FlatList
                    data={allComments}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.commentId.toString()}
                    style={styles.list}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} /> : null
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text>아직 댓글이 없습니다.</Text>
                        </View>
                    }
                />

                {/* 대댓글 작성 중 알림 UI */}
                {replyTo && (
                    <View style={styles.replyingToContainer}>
                        <Text style={styles.replyingToText}>
                            @{replyTo.nickname}님에게 답글 다는 중...
                        </Text>
                        <TouchableOpacity onPress={cancelReply}>
                            <Ionicons name="close" size={20} color="#555" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* 댓글 수정 중 알림 UI */}
                {editingComment && (
                    <View style={styles.replyingToContainer}>
                        <Text style={styles.replyingToText}>
                            댓글 수정 중...
                        </Text>
                        <TouchableOpacity onPress={cancelEdit}>
                            <Ionicons name="close" size={20} color="#555" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* 댓글 입력창 */}
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={textInputRef}
                        style={styles.input}
                        placeholder={
                            editingComment
                                ? '댓글을 수정하세요...'
                                : replyTo
                                ? `@${replyTo.nickname}님에게 답글 남기기...`
                                : '댓글을 남겨주세요...'
                        }
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (createCommentMutation.isPending || updateCommentMutation.isPending) && styles.sendButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={createCommentMutation.isPending || updateCommentMutation.isPending}
                    >
                        {(createCommentMutation.isPending || updateCommentMutation.isPending) ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.sendButtonText}>
                                {editingComment ? '수정' : replyTo ? '답글' : '등록'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// --- 5. 스타일시트 ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    list: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
    },
    errorText: {
        color: 'red',
    },

    // 댓글 아이템
    commentItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    replyItem: {
        // 대댓글 스타일
    },
    authorImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    commentContent: {
        flex: 1,
    },
    authorName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    commentFooter: {
        flexDirection: 'row',
        marginTop: 8,
        alignItems: 'center',
    },
    commentDate: {
        fontSize: 12,
        color: '#999',
    },
    footerActionText: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
        marginLeft: 12,
    },
    myCommentActions: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
    },

    // 대댓글 목록
    replyListContainer: {
        marginLeft: 48, // 36(이미지) + 12(여백)
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    // 대댓글 작성 중 알림
    replyingToContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f0f0f0',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    replyingToText: {
        fontSize: 14,
        color: '#555',
    },

    // 하단 입력창
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120, // 4-5줄 정도
        backgroundColor: '#f0f0f0',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 16,
        marginRight: 10,
    },
    sendButton: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1298FF',
        borderRadius: 22,
        paddingHorizontal: 18,
    },
    sendButtonDisabled: {
        backgroundColor: '#aaa',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
