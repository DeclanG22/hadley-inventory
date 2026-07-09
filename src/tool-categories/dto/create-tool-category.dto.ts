import { IsString, IsNotEmpty } from 'class-validator';

export class CreateToolCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
