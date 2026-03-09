import { Module } from '@nestjs/common';
import { JobMatchController } from './job-match.controller';
import { JobMatchService } from './job-match.service';

@Module({
    controllers: [JobMatchController],
    providers: [JobMatchService],
    exports: [JobMatchService],
})
export class JobMatchModule { }
