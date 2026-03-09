import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from '../storage/storage.module';
import { ImportValidationModule } from '../import-validation/import-validation.module';

@Module({
  imports: [
    StorageModule,
    ImportValidationModule,
    BullModule.registerQueue({
      name: 'payroll-analysis',
    }),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule { }

