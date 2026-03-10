import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('market-benchmark')
export class MarketBenchmarkController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async findAll(
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '20',
        @Query('search') search?: string,
        @Query('level') level?: string,
    ) {
        const pageNum = parseInt(page, 10) || 1;
        const pageSizeNum = Math.min(parseInt(pageSize, 10) || 20, 100);
        const skip = (pageNum - 1) * pageSizeNum;

        const where: any = {};

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
}
