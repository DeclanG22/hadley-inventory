import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateToolDto {
  @IsString()
  @IsNotEmpty()
  toolNumber!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

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
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  purchaseCost?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  locationId?: number;
}
