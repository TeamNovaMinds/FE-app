// utils/imageUpload.ts

import axiosInstance from '@/api/axiosInstance';
import { PresignedUrlRequest, PresignedUrlResponse, UploadImageResult } from '@/types/image';

/**
 * 백엔드에서 presignedUrl을 요청하는 함수
 */
const getPresignedUrl = async (
    originalFileName: string,
    contentType: string
): Promise<{ presignedUrl: string; imageUrl: string }> => {
    const requestBody: PresignedUrlRequest = {
        originalFileName,
        contentType,
    };

    const response = await axiosInstance.post<PresignedUrlResponse>(
        '/api/s3/image/upload-url',
        requestBody
    );

    if (response.data.isSuccess) {
        return {
            presignedUrl: response.data.result.presignedUrl,
            imageUrl: response.data.result.imageUrl,
        };
    }

    throw new Error(response.data.message || 'presignedUrl 요청에 실패했습니다.');
};

/**
 * S3에 이미지를 업로드하는 함수 (비동기)
 */
const uploadImageToS3 = async (
    presignedUrl: string,
    imageUri: string,
    contentType: string
): Promise<void> => {
    try {
        console.log('[S3 업로드 시작]');
        console.log('presignedUrl:', presignedUrl);
        console.log('imageUri:', imageUri);
        console.log('contentType:', contentType);

        // URI에서 실제 파일 데이터를 가져오기
        const fileResponse = await fetch(imageUri);
        const blob = await fileResponse.blob();

        console.log('blob 크기:', blob.size);
        console.log('blob 타입:', blob.type);

        // S3에 PUT 요청 (fetch API 사용)
        const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
            },
            body: blob,
        });

        console.log('S3 업로드 응답 상태:', uploadResponse.status);

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('S3 업로드 실패:', errorText);
            throw new Error(`S3 업로드 실패: ${uploadResponse.status} - ${errorText}`);
        }

        console.log('[S3 업로드 성공]');
    } catch (error) {
        console.error('[S3 업로드 에러]:', error);
        throw error;
    }
};

/**
 * 이미지 업로드 전체 프로세스를 처리하는 메인 함수
 * @param imageUri - 선택된 이미지의 로컬 URI
 * @param fileName - 파일 이름 (확장자 포함)
 * @returns imageUrl - S3에 업로드된 이미지의 최종 URL
 */
export const uploadImage = async (
    imageUri: string,
    fileName: string
): Promise<UploadImageResult> => {
    try {
        console.log('=== 이미지 업로드 시작 ===');
        console.log('파일 이름:', fileName);
        console.log('이미지 URI:', imageUri);

        // 1. 파일 확장자로부터 contentType 추출
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        let contentType = 'image/jpeg'; // 기본값

        switch (fileExtension) {
            case 'jpg':
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'png':
                contentType = 'image/png';
                break;
            case 'gif':
                contentType = 'image/gif';
                break;
            case 'webp':
                contentType = 'image/webp';
                break;
            default:
                contentType = 'image/jpeg';
        }

        console.log('Content-Type:', contentType);

        // 2. presignedUrl 요청
        console.log('[1단계] presignedUrl 요청 중...');
        const { presignedUrl, imageUrl } = await getPresignedUrl(fileName, contentType);
        console.log('[1단계 완료] presignedUrl 받음');
        console.log('최종 이미지 URL:', imageUrl);

        // 3. S3에 이미지 업로드 (완료될 때까지 대기)
        console.log('[2단계] S3 업로드 시작...');
        await uploadImageToS3(presignedUrl, imageUri, contentType);
        console.log('[2단계 완료] S3 업로드 성공');

        // 4. 업로드 완료 후 imageUrl 반환
        console.log('=== 이미지 업로드 완료 ===');
        return { imageUrl };
    } catch (error) {
        console.error('=== 이미지 업로드 실패 ===');
        console.error('에러:', error);
        throw error;
    }
};

/**
 * 파일 크기 검증 함수
 * @param fileSize - 파일 크기 (bytes)
 * @param maxSizeMB - 최대 허용 크기 (MB)
 * @returns boolean
 */
export const validateFileSize = (fileSize: number, maxSizeMB: number = 10): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return fileSize <= maxSizeBytes;
};

/**
 * 파일 타입 검증 함수
 * @param fileName - 파일 이름
 * @returns boolean
 */
export const validateFileType = (fileName: string): boolean => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    return fileExtension ? allowedExtensions.includes(fileExtension) : false;
};