import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateItemSubCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  itemCategoryId: number;
}
