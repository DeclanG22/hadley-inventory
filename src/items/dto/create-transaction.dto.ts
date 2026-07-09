import { IsInt, IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  jobNumber?: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Type(() => Number)
  quantityInOut: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
