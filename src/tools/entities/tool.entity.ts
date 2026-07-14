export class ToolEntity {
  id!: number;
  toolNumber!: string;
  name!: string;
  description!: string | null;
  brand!: string | null;
  model!: string | null;
  serialNumber!: string | null;
  qrCode!: string | null;
  imageUrl!: string | null;
  notes!: string | null;
  categoryId!: number | null;
  locationId!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}
