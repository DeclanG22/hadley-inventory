import { IsString, IsNotEmpty } from 'class-validator';

export class CreateItemSubCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
