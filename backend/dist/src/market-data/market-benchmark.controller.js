"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketBenchmarkController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MarketBenchmarkController = class MarketBenchmarkController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = '1', pageSize = '20', search, level) {
        const pageNum = parseInt(page, 10) || 1;
        const pageSizeNum = Math.min(parseInt(pageSize, 10) || 20, 100);
        const skip = (pageNum - 1) * pageSizeNum;
        const where = {};
        if (search) {
            where.job_catalog = {
                title_std: {
                    contains: search,
                    mode: 'insensitive',
                }
            };
        }
        if (level && level !== 'ALL') {
            where.job_catalog = {
                ...where.job_catalog,
                level: level,
            };
        }
        const [data, total] = await Promise.all([
            this.prisma.marketBenchmark.findMany({
                where,
                include: {
                    job_catalog: {
                        select: {
                            title_std: true,
                            level: true,
                            family: true,
                            grade: true,
                        }
                    }
                },
                orderBy: {
                    job_catalog: { title_std: 'asc' }
                },
                skip,
                take: pageSizeNum,
            }),
            this.prisma.marketBenchmark.count({ where }),
        ]);
        return {
            data,
            total,
            page: pageNum,
            pageSize: pageSizeNum,
        };
    }
};
exports.MarketBenchmarkController = MarketBenchmarkController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], MarketBenchmarkController.prototype, "findAll", null);
exports.MarketBenchmarkController = MarketBenchmarkController = __decorate([
    (0, common_1.Controller)('market-benchmark'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketBenchmarkController);
//# sourceMappingURL=market-benchmark.controller.js.map