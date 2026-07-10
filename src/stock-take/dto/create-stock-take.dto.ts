import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateStockTakeDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
