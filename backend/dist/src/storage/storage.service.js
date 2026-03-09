"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let StorageService = class StorageService {
    config;
    s3;
    bucket;
    useLocal = true;
    localStoragePath = path.join(process.cwd(), 'storage');
    constructor(config) {
        this.config = config;
        this.useLocal = this.config.get('USE_LOCAL_STORAGE', 'true') === 'true';
        if (!this.useLocal) {
            this.s3 = new client_s3_1.S3Client({
                region: this.config.get('AWS_REGION', 'us-east-1'),
            });
            this.bucket = this.config.get('S3_BUCKET_NAME', 'payroll-uploads');
        }
        else {
            console.log('--- STORAGE: Modo LOCAL ATIVO (Economizando S3) ---');
            if (!fs.existsSync(this.localStoragePath)) {
                fs.mkdirSync(this.localStoragePath, { recursive: true });
            }
        }
    }
    async getPresignedUrl(key, contentType = 'application/octet-stream') {
        if (this.useLocal) {
            return `http://localhost:3000/local-storage/${key}`;
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn: 3600 });
    }
    async getSignedDownloadUrl(key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, { expiresIn: 3600 });
    }
    async uploadFile(key, body, contentType) {
        if (this.useLocal) {
            const fullPath = path.join(this.localStoragePath, key);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fullPath, body);
            return { status: 'ok' };
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        });
        return this.s3.send(command);
    }
    async getFile(key) {
        if (this.useLocal) {
            const fullPath = path.join(this.localStoragePath, key);
            if (!fs.existsSync(fullPath))
                throw new Error(`File not found: ${key}`);
            return fs.createReadStream(fullPath);
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const { Body } = await this.s3.send(command);
        return Body;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map