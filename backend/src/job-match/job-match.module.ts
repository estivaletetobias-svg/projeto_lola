import { Module } from '@nestjs/common';
import { JobMatchController } from './job-match.controller';
import { JobMatchService } from './job-match.service';
import { JobCatalogModule } from '../job-catalog/job-catalog.module';

@Module({
    imports: [JobCatalogModule],
    controllers: [JobMatchController],
    providers: [JobMatchService],
    exports: [JobMatchService],
})
export class JobMatchModule { }
