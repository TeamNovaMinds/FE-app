// types/image.ts

export interface PresignedUrlRequest {
    originalFileName: string;
    contentType: string;
}

export interface PresignedUrlResponse {
    isSuccess: boolean;
    code: string;
    message: string;
    result: {
        presignedUrl: string;
        imageUrl: string;
    };
}

export interface UploadImageResult {
    imageUrl: string;
}