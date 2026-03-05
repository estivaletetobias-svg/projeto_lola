import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
    private s3: S3Client;
    private bucket: string;

    constructor(private config: ConfigService) {
        this.s3 = new S3Client({
            region: this.config.get('AWS_REGION', 'us-east-1'),
            // Credentials automatically loaded from env or AWS ecosystem
        });
        this.bucket = this.config.get('S3_BUCKET_NAME', 'payroll-uploads');
    }

    async getPresignedUrl(key: string, contentType: string = 'application/octet-stream'): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });

        return getSignedUrl(this.s3, command, { expiresIn: 3600 });
    }

    async getSignedDownloadUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.s3, command, { expiresIn: 3600 });
    }

    async uploadFile(key: string, body: Buffer | string, contentType?: string) {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        });
        return this.s3.send(command);
    }

    async getFile(key: string) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const { Body } = await this.s3.send(command);
        return Body;
    }
}
