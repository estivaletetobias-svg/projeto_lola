import { Module } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsController } from './diagnostics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DiagnosticsController],
    providers: [DiagnosticsService],
    exports: [DiagnosticsService],
})
export class DiagnosticsModule { }
