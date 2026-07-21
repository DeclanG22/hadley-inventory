export class ToolEntity {
  id!: number;
  name!: string;
  description!: string | null;
  heNumber!: string | null;
  serialNumber!: string | null;
  labelPrinted!: boolean;
  qrCode!: string | null;
  imageUrl!: string | null;
  notes!: string | null;
  locationId!: number | null;
  vendorId!: number | null;
  decommissionedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
