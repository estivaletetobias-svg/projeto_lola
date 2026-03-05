import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ImportValidationProcessor } from './import-validation.processor';

@Module({
    imports: [StorageModule],
    providers: [ImportValidationProcessor],
})
export class ImportValidationModule { }
