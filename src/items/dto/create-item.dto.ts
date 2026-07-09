import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  itemNumber: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weightPerUnit?: number;

  @IsOptional()
  @IsString()
  analysisCode?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  removeFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  labelPrinted?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  subCategoryId?: number;

  @IsOptional()
  @IsString()
  headType?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  locationId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  vendorId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  onHand?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  lastQtyInOut?: number;

  @IsOptional()
  @IsString()
  lastJobNumber?: string;

  @IsOptional()
  @IsString()
  dateAdded?: string;

  @IsOptional()
  @IsString()
  dateDisbursed?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalCost?: number;
}
