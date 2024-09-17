import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceService } from '../invoice/invoice.service';
import * as amqp from 'amqplib';

@Injectable()
export class CronService implements OnModuleInit, OnModuleDestroy {
  private amqpConnection: amqp.Connection;

  constructor(private readonly invoiceService: InvoiceService) {}

  async onModuleInit() {
    try {
      this.amqpConnection = await amqp.connect(process.env.RABBITMQ_URL);
      console.log('AMQP connected successfully');
      this.handleCron();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  // @Cron("0 12 * * *")
  async handleCron() {
    console.log('Cron job triggered at noon');
    
    try {
      const { totalSales, itemsSummary } = await this.invoiceService.getDailySalesSummary();
      console.log('Daily sales summary retrieved:', { totalSales, itemsSummary });
  
      const channel = await this.amqpConnection.createChannel();
      console.log('Channel created successfully');
  
      await channel.assertQueue('daily_sales_report', { durable: true });
      console.log('Queue asserted');
  
      channel.sendToQueue(
        'daily_sales_report',
        Buffer.from(JSON.stringify({ totalSales, itemsSummary })),
        { persistent: true }
      );
      console.log('Daily sales report sent');
      
      await channel.close(); // Close channel after sending the message
      console.log('Channel closed');
    } catch (error) {
      console.error('Failed to send daily sales report:', error);
    }
  }
  
  async onModuleDestroy() {
    if (this.amqpConnection) {
      await this.amqpConnection.close();
      console.log('AMQP connection closed');
    }
  }
}
