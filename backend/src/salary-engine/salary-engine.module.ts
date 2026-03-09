import { Module } from '@nestjs/common';
import { SalaryEngineService } from './salary-engine.service';
import { SalaryEngineController } from './salary-engine.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SalaryEngineController],
    providers: [SalaryEngineService],
    exports: [SalaryEngineService],
})
export class SalaryEngineModule { }
