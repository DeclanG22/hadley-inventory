export class ItemEntity {
  id: number;
  itemNumber: string;
  description: string;
  productType: string | null;
  unit: string | null;
  unitPrice: number | null;
  weightPerUnit: number | null;
  analysisCode: string | null;
  removeFlag: boolean;
  labelPrinted: boolean;
  categoryId: number | null;
  subCategoryId: number | null;
  headType: string | null;
  qrCode: string | null;
  locationId: number | null;
  vendorId: number | null;
  onHand: number;
  lastQtyInOut: number | null;
  lastJobNumber: string | null;
  dateAdded: Date | null;
  dateDisbursed: Date | null;
  totalCost: number | null;
  createdAt: Date;
  updatedAt: Date;
}
