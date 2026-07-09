import { IsString, IsNotEmpty } from 'class-validator';

export class CreateItemCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
