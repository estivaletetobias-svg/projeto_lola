import { Module } from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketBenchmarkController } from './market-benchmark.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MarketDataController, MarketBenchmarkController],
  providers: [MarketDataService, PrismaService]
})
export class MarketDataModule { }
