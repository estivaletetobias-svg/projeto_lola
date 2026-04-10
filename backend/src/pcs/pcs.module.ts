import { Module } from '@nestjs/common';
import { PcsController } from './pcs.controller';
import { PcsService } from './pcs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PcsController],
    providers: [PcsService],
    exports: [PcsService]
})
export class PcsModule {}
