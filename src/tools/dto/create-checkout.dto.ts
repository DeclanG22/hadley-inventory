import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  checkedOutBy: string;

  @IsOptional()
  @IsString()
  jobNumber?: string;

  @IsOptional()
  @IsString()
  jobSite?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
