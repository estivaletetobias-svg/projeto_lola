import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        try {
            await this.$connect();
        } catch (e) {
            console.error('Database connection failed, but app will continue for logic tests.');
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
