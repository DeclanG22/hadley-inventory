import { Module } from '@nestjs/common';
import { ToolCategoriesController } from './tool-categories.controller';
import { ToolCategoriesService } from './tool-categories.service';

@Module({
  controllers: [ToolCategoriesController],
  providers: [ToolCategoriesService],
})
export class ToolCategoriesModule {}
