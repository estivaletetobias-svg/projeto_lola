import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobCatalogService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.jobCatalog.findMany({
            orderBy: { title_std: 'asc' }
        });
    }
}
