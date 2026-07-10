import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { VendorsModule } from './vendors/vendors.module';
import { LocationsModule } from './locations/locations.module';
import { ItemCategoriesModule } from './item-categories/item-categories.module';
import { ToolCategoriesModule } from './tool-categories/tool-categories.module';
import { ItemsModule } from './items/items.module';
import { ToolsModule } from './tools/tools.module';
import { ActivityModule } from './activity/activity.module';
import { ImportModule } from './import/import.module';
import { StockTakeModule } from './stock-take/stock-take.module';

@Module({
  imports: [
    PrismaModule,
    VendorsModule,
    LocationsModule,
    ItemCategoriesModule,
    ToolCategoriesModule,
    ItemsModule,
    ToolsModule,
    ActivityModule,
    ImportModule,
    StockTakeModule,
  ],
})
export class AppModule {}
