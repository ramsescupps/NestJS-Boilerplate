import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { mock } from 'jest-mock-extended';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let configService: ConfigService;
  let amqpConnection: amqp.Connection;
  let amqpChannel: amqp.Channel;

  beforeEach(async () => {
    // Mock the amqp connection and channel
    amqpConnection = mock<amqp.Connection>();
    amqpChannel = mock<amqp.Channel>();
    amqpConnection.createChannel = jest.fn().mockResolvedValue(amqpChannel);
    amqpChannel.assertQueue = jest.fn();
    amqpChannel.consume = jest.fn();
    amqpChannel.ack = jest.fn();

    // Mock the amqp.connect function
    jest.spyOn(amqp, 'connect').mockResolvedValue(amqpConnection);

    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                RABBITMQ_URL: 'amqp://localhost',
                MAIL_TO: 'recipient@example.com',
                MAIL_FROM: 'sender@example.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send an email', async () => {
    const report = {
      totalSales: 1000,
      itemsSummary: {
        'ITEM001': 10,
        'ITEM002': 5,
      },
    };

    await service.sendEmail(report);

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'recipient@example.com',
      from: 'sender@example.com',
      subject: 'Daily Sales Summary Report',
      text: 'Total Sales: 1000\n\nItems Summary:\nITEM001: 10\nITEM002: 5',
    });
  });
});
