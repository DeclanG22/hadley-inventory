import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ToolImportService } from './tool-import.service';

@Controller('tools/import')
export class ToolImportController {
  constructor(private readonly toolImportService: ToolImportService) {}

  @Get('fields')
  getFields() {
    return ToolImportService.getFields();
  }

  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  analyze(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.toolImportService.analyze(file.buffer, file.originalname);
  }

  @Post('execute')
  async execute(
    @Body() body: { fileToken: string; columnMap: Record<string, string> },
  ) {
    if (!body.fileToken) {
      throw new BadRequestException('Missing fileToken');
    }
    if (!body.columnMap || Object.keys(body.columnMap).length === 0) {
      throw new BadRequestException('Missing columnMap');
    }
    return this.toolImportService.execute(body.fileToken, body.columnMap);
  }
}
