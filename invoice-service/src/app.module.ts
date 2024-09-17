import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceModule } from './invoice/invoice.module';
import { CronService } from './cron/cron.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    InvoiceModule,  // <-- Ensure InvoiceModule is imported
    ScheduleModule.forRoot(),
  ],
  providers: [CronService],
})
export class AppModule {}
