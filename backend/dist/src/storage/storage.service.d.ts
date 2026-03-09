import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private config;
    private s3;
    private bucket;
    constructor(config: ConfigService);
    getPresignedUrl(key: string, contentType?: string): Promise<string>;
    getSignedDownloadUrl(key: string): Promise<string>;
    uploadFile(key: string, body: Buffer | string, contentType?: string): Promise<import("@aws-sdk/client-s3").PutObjectCommandOutput>;
    getFile(key: string): Promise<import("@smithy/types").StreamingBlobPayloadOutputTypes | undefined>;
}
