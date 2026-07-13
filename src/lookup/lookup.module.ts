import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LookupController } from './lookup.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LookupController],
})
export class LookupModule {}
