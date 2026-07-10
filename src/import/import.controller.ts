import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';

@Controller('items/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get('fields')
  getFields() {
    return ImportService.getFields();
  }

  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  analyze(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.importService.analyze(file.buffer, file.originalname);
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
    return this.importService.execute(body.fileToken, body.columnMap);
  }
}
