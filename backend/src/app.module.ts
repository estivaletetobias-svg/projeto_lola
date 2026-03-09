import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { PayrollModule } from './payroll/payroll.module';
import { ImportValidationModule } from './import-validation/import-validation.module';
import { JobCatalogModule } from './job-catalog/job-catalog.module';
import { JobMatchModule } from './job-match/job-match.module';
import { MarketDataModule } from './market-data/market-data.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { MeritCycleModule } from './merit-cycle/merit-cycle.module';
import { CopilotModule } from './copilot/copilot.module';
import { PrismaModule } from './prisma/prisma.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { StorageModule } from './storage/storage.module';
import { SalaryEngineModule } from './salary-engine/salary-engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
          maxRetriesPerRequest: null,
          connectTimeout: 2000,
          retryStrategy: (times: number) => {
            if (times > 3) return null; // stop retrying after 3 times to let the app run (with reduced functionality)
            return Math.min(times * 100, 2000);
          }
        },
      }),
    }),
    AuthModule,
    TenantsModule,
    PayrollModule,
    ImportValidationModule,
    JobCatalogModule,
    JobMatchModule,
    MarketDataModule,
    DiagnosticsModule,
    MeritCycleModule,
    CopilotModule,
    PrismaModule,
    StorageModule,
    SalaryEngineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
