import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateToolDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  heNumber?: number;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  vendorId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  purchaseCost?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  locationId?: number;
}
