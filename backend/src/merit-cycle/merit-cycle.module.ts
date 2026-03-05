import { Module } from '@nestjs/common';
import { MeritCycleController } from './merit-cycle.controller';
import { MeritCycleService } from './merit-cycle.service';

@Module({
  controllers: [MeritCycleController],
  providers: [MeritCycleService]
})
export class MeritCycleModule {}
