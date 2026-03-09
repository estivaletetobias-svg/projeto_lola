import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { Readable } from 'stream';
export declare class StorageService {
    private config;
    private s3;
    private bucket;
    private useLocal;
    private localStoragePath;
    constructor(config: ConfigService);
    getPresignedUrl(key: string, contentType?: string): Promise<string>;
    getSignedDownloadUrl(key: string): Promise<string>;
    uploadFile(key: string, body: Buffer | string, contentType?: string): Promise<import("@aws-sdk/client-s3").PutObjectCommandOutput | {
        status: string;
    }>;
    getFile(key: string): Promise<fs.ReadStream | (Readable & import("@smithy/types").SdkStreamMixin) | (ReadableStream<any> & import("@smithy/types").SdkStreamMixin) | (Blob & import("@smithy/types").SdkStreamMixin) | undefined>;
}
