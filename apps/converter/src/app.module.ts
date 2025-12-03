import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConversionsModule } from './conversions/conversions.module';
import { FormatsModule } from './formats/formats.module';
import { HealthModule } from './health/health.module';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [ConversionsModule, FormatsModule, HealthModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ProblemDetailsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
