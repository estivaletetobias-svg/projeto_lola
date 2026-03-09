import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
    private s3: S3Client;
    private bucket: string;
    private useLocal = true;
    private localStoragePath = path.join(process.cwd(), 'storage');

    constructor(private config: ConfigService) {
        this.useLocal = this.config.get('USE_LOCAL_STORAGE', 'true') === 'true';

        if (!this.useLocal) {
            this.s3 = new S3Client({
                region: this.config.get('AWS_REGION', 'us-east-1'),
            });
            this.bucket = this.config.get('S3_BUCKET_NAME', 'payroll-uploads');
        } else {
            console.log('--- STORAGE: Modo LOCAL ATIVO (Economizando S3) ---');
            if (!fs.existsSync(this.localStoragePath)) {
                fs.mkdirSync(this.localStoragePath, { recursive: true });
            }
        }
    }

    async getPresignedUrl(key: string, contentType: string = 'application/octet-stream'): Promise<string> {
        if (this.useLocal) {
            // No modo local, o "Upload" é simulado retornando uma URL local ou apenas permitindo o bypass
            return `http://localhost:3000/local-storage/${key}`;
        }
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
        if (this.useLocal) {
            const fullPath = path.join(this.localStoragePath, key);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fullPath, body);
            return { status: 'ok' };
        }
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        });
        return this.s3.send(command);
    }

    async getFile(key: string) {
        if (this.useLocal) {
            const fullPath = path.join(this.localStoragePath, key);
            if (!fs.existsSync(fullPath)) throw new Error(`File not found: ${key}`);
            return fs.createReadStream(fullPath);
        }
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const { Body } = await this.s3.send(command);
        return Body;
    }
}
