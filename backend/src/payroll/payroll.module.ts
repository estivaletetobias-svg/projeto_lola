import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    StorageModule,
    BullModule.registerQueue({
      name: 'payroll-analysis',
    }),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule { }

