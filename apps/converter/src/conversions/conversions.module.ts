import { Module } from '@nestjs/common';
import { ConversionsController } from './conversions.controller';
import { ConversionsService } from './conversions.service';
import { PrinterService } from './printer.service';

@Module({
  controllers: [ConversionsController],
  providers: [ConversionsService, PrinterService],
  exports: [PrinterService],
})
export class ConversionsModule {}
