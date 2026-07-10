import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockTakeItemDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  physicalQty: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
