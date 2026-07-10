import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateStockTakeDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'completed', 'cancelled'])
  status?: string;
}
