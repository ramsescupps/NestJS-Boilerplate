import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as amqp from 'amqplib';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService implements OnModuleInit {
  private amqpConnection: amqp.Connection;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  // Connect to RabbitMQ
  async connectToRabbitMQ() {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL') || process.env.RABBITMQ_URL;
      this.amqpConnection = await amqp.connect(rabbitmqUrl);
      console.log('Connected to RabbitMQ successfully.');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
    }
  }

  async onModuleInit() {
    // Wait for the connection to be established
    await this.connectToRabbitMQ();

    if (!this.amqpConnection) {
      throw new Error('Failed to establish RabbitMQ connection.');
    }

    // Create a channel once connected
    const channel = await this.amqpConnection.createChannel();
    await channel.assertQueue('daily_sales_report', { durable: true });

    // Consume messages from the queue
    channel.consume('daily_sales_report', async (msg) => {
      if (msg !== null) {
        try {
          const messageContent = msg.content.toString();
          console.log('messageContent', messageContent);
          // Check for empty message content
          if (!messageContent) {
            console.error('Received an empty message.');
            channel.ack(msg);
            return;
          }

          // Try to parse the message content
          const report = JSON.parse(messageContent);
          console.log('Received report:', report);

          await this.sendEmail(report);
          channel.ack(msg); // Acknowledge the message after processing
        } catch (error) {
          console.error('Failed to process message:', error);
          channel.ack(msg); // Acknowledge the message even if processing fails
        }
      }
    });

    console.log('Email consumer is ready and waiting for messages...');
  }

  async sendEmail(report: any) {
    try {
      await this.mailerService.sendMail({
        to: this.configService.get<string>('MAIL_TO'),
        from: this.configService.get<string>('MAIL_FROM'),
        subject: 'Daily Sales Summary Report',
        text: `Total Sales: ${report.totalSales}\n\nItems Summary:\n${Object.entries(report.itemsSummary).map(([sku, qt]) => `${sku}: ${qt}`).join('\n')}`,
      });
      console.log('Email sent successfully.');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}
