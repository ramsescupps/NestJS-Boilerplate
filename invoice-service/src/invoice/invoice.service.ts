import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from './invoice.schema';
import { CreateInvoiceDto, QueryInvoiceDto } from './invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(@InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const createdInvoice = new this.invoiceModel(createInvoiceDto);
    return createdInvoice.save();
  }

  async findOne(id: string): Promise<Invoice> {
    return this.invoiceModel.findById(id).exec();
  }

  async findAll(query: QueryInvoiceDto): Promise<Invoice[]> {
    return this.invoiceModel.find(query).exec();
  }

  async getDailySalesSummary(): Promise<{ totalSales: number; itemsSummary: Record<string, number> }> {
    // Implementation will be done in cron job
    return { totalSales: 0, itemsSummary: {} };
  }
}
