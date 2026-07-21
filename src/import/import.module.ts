import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ToolImportController } from './tool-import.controller';
import { ToolImportService } from './tool-import.service';

@Module({
  controllers: [ImportController, ToolImportController],
  providers: [ImportService, ToolImportService],
})
export class ImportModule {}
