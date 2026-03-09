import { Module } from '@nestjs/common';
import { JobCatalogService } from './job-catalog.service';

@Module({
    providers: [JobCatalogService],
    exports: [JobCatalogService],
})
export class JobCatalogModule { }
