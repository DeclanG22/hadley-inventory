-- CreateTable
CREATE TABLE "stock_takes" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_takes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_take_items" (
    "id" SERIAL NOT NULL,
    "stock_take_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "system_qty" INTEGER NOT NULL,
    "physical_qty" INTEGER,
    "notes" TEXT,

    CONSTRAINT "stock_take_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_take_items_stock_take_id_item_id_key" ON "stock_take_items"("stock_take_id", "item_id");

-- AddForeignKey
ALTER TABLE "stock_take_items" ADD CONSTRAINT "stock_take_items_stock_take_id_fkey" FOREIGN KEY ("stock_take_id") REFERENCES "stock_takes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_take_items" ADD CONSTRAINT "stock_take_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
