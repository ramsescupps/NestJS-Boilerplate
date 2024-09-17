import { IsString, IsNumber, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsString()
  customer: string;

  @IsNumber()
  amount: number;

  @IsString()
  reference: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}

export class ItemDto {
  @IsString()
  sku: string;

  @IsNumber()
  qt: number;
}

export class QueryInvoiceDto {
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
