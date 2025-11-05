import { formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale'; // 한국어 로케일 임포트

/**
 * ISO 형식의 날짜 문자열을 "5분 전", "약 1시간 전" 등으로 변환합니다.
 * @param dateString - '2025-11-05T10:49:51.638Z'와 같은 ISO 날짜 문자열
 * @returns '... 전' 형태의 문자열
 */
export function formatRelativeTime(dateString: string): string {
    if (!dateString) {
        return '';
    }

    try {
        const date = parseISO(dateString); // ISO 문자열을 Date 객체로 파싱

        // 현재 시간과 비교하여 상대적인 시간으로 포맷팅
        return formatDistanceToNow(date, {
            addSuffix: true, // '... 전' 또는 '... 후' 접미사 추가
            locale: ko, // 한국어 설정
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // 오류 발생 시 원본 문자열 반환
    }
}