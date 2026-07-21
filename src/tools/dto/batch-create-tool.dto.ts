import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchCreateToolDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  heNumberStart?: number;

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
  @IsInt()
  @Type(() => Number)
  locationId?: number;
}
