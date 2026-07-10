import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';

const COLUMNS: Record<string, string> = {
  'item number': 'itemNumber',
  'item #': 'itemNumber',
  'item no': 'itemNumber',
  'item no.': 'itemNumber',
  'part number': 'itemNumber',
  'part #': 'itemNumber',
  'part no': 'itemNumber',
  'part no.': 'itemNumber',
  'item': 'itemNumber',
  'part': 'itemNumber',
  'ref': 'itemNumber',
  'reference': 'itemNumber',
  'sku': 'itemNumber',
  'product code': 'itemNumber',
  'description': 'description',
  'desc': 'description',
  'item description': 'description',
  'product description': 'description',
  'name': 'description',
  'product name': 'description',
  'date added': 'dateAdded',
  'added': 'dateAdded',
  'date created': 'dateAdded',
  'created date': 'dateAdded',
  'created': 'dateAdded',
  'on hand': 'onHand',
  'on-hand': 'onHand',
  'qty': 'onHand',
  'qty on hand': 'onHand',
  'quantity': 'onHand',
  'quantity on hand': 'onHand',
  'stock': 'onHand',
  'in stock': 'onHand',
  'current stock': 'onHand',
  'balance': 'onHand',
  'last quantity in or out': 'lastQtyInOut',
  'last qty': 'lastQtyInOut',
  'last quantity': 'lastQtyInOut',
  'last in/out': 'lastQtyInOut',
  'last movement': 'lastQtyInOut',
  'unit price': 'unitPrice',
  'price': 'unitPrice',
  'unit price $': 'unitPrice',
  'cost': 'unitPrice',
  'unit cost': 'unitPrice',
  'price per unit': 'unitPrice',
  'rate': 'unitPrice',
  'last job number': 'jobNumber',
  'job number': 'jobNumber',
  'job #': 'jobNumber',
  'job no': 'jobNumber',
  'job no.': 'jobNumber',
  'job': 'jobNumber',
  'work order': 'jobNumber',
  'wo': 'jobNumber',
  'date disbursed': 'dateDisbursed',
  'disbursed': 'dateDisbursed',
  'date disbursed or added': 'dateDisbursed',
  'date removed': 'dateDisbursed',
  'removed': 'dateDisbursed',
  'issued': 'dateDisbursed',
  'date issued': 'dateDisbursed',
  'total cost': 'totalCost',
  'total': 'totalCost',
  'total $': 'totalCost',
  'total price': 'totalCost',
  'amount': 'totalCost',
  'unit': 'unit',
  'uom': 'unit',
  'unit of measure': 'unit',
  'measure': 'unit',
  'location': 'locationName',
  'loc': 'locationName',
  'bin': 'locationName',
  'shelf': 'locationName',
  'aisle': 'locationName',
  'storage': 'locationName',
  'area': 'locationName',
  'warehouse': 'locationName',
  'analysis code': 'analysisCode',
  'code': 'analysisCode',
  'analysis': 'analysisCode',
  'acc code': 'analysisCode',
  'account code': 'analysisCode',
  'gl code': 'analysisCode',
  'inventory type': 'analysisCode',
  'inv type': 'analysisCode',
  'primary vendor': 'vendorName',
  'vendor': 'vendorName',
  'supplier': 'vendorName',
  'vendor name': 'vendorName',
  'supplier name': 'vendorName',
  'manufacturer': 'vendorName',
  'brand': 'vendorName',
  'weight/unit (grams)': 'weightPerUnit',
  'weight': 'weightPerUnit',
  'weight (grams)': 'weightPerUnit',
  'weight per unit': 'weightPerUnit',
  'wt': 'weightPerUnit',
  'wt/unit': 'weightPerUnit',
  'grams': 'weightPerUnit',
  'category': 'categoryName',
  'cat': 'categoryName',
  'item category': 'categoryName',
  'product category': 'categoryName',
  'group': 'categoryName',
  'sub-category': 'subCategoryName',
  'sub category': 'subCategoryName',
  'subcat': 'subCategoryName',
  'sub cat': 'subCategoryName',
  'subcategory': 'subCategoryName',
  'head type': 'headType',
  'head': 'headType',
  'head style': 'headType',
  'drive type': 'headType',
  'remove?': 'removeFlag',
  'remove': 'removeFlag',
  'removed?': 'removeFlag',
  'deleted': 'removeFlag',
  'inactive': 'removeFlag',
  'archived': 'removeFlag',
  'label printed': 'labelPrinted',
  'printed': 'labelPrinted',
  'label?': 'labelPrinted',
};

const FIELDS = [
  { value: 'itemNumber', label: 'Item Number', required: true },
  { value: 'description', label: 'Description', required: true },
  { value: 'dateAdded', label: 'Date Added', required: false },
  { value: 'onHand', label: 'On Hand', required: false },
  { value: 'lastQtyInOut', label: 'Last Quantity In or Out', required: false },
  { value: 'unitPrice', label: 'Unit Price', required: false },
  { value: 'jobNumber', label: 'Job Number', required: false },
  { value: 'dateDisbursed', label: 'Date Disbursed', required: false },
  { value: 'totalCost', label: 'Total Cost', required: false },
  { value: 'unit', label: 'Unit', required: false },
  { value: 'locationName', label: 'Location', required: false },
  { value: 'analysisCode', label: 'Analysis Code', required: false },
  { value: 'vendorName', label: 'Primary Vendor', required: false },
  { value: 'weightPerUnit', label: 'Weight/Unit (grams)', required: false },
  { value: 'categoryName', label: 'Category', required: false },
  { value: 'subCategoryName', label: 'Sub-Category', required: false },
  { value: 'headType', label: 'Head Type', required: false },
  { value: 'removeFlag', label: 'Remove?', required: false },
  { value: 'labelPrinted', label: 'Label Printed', required: false },
];

const REQUIRED_FIELDS = ['itemNumber', 'description'];

interface StoredFile {
  buffer: Buffer;
  filename: string;
  expiresAt: number;
}

interface ImportRow {
  itemNumber: string;
  description: string;
  dateAdded?: string;
  onHand?: number;
  lastQtyInOut?: number;
  unitPrice?: number;
  jobNumber?: string;
  dateDisbursed?: string;
  totalCost?: number;
  unit?: string;
  locationName?: string;
  analysisCode?: string;
  vendorName?: string;
  weightPerUnit?: number;
  categoryName?: string;
  subCategoryName?: string;
  headType?: string;
  removeFlag?: boolean;
  labelPrinted?: boolean;
}

export interface AnalyzeResult {
  fileToken: string;
  filename: string;
  totalRows: number;
  columns: string[];
  mapping: Record<string, string | null>;
  preview: Record<string, string>;
  unrecognized: string[];
  missing: string[];
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

@Injectable()
export class ImportService {
  private fileStore = new Map<string, StoredFile>();

  constructor(private readonly prisma: PrismaService) {
    setInterval(() => this.cleanExpired(), 60_000);
  }

  analyze(buffer: Buffer, filename: string): AnalyzeResult {
    const { headerKeys, rows } = this.parseFile(buffer);
    const totalRows = rows.length;

    const preview: Record<string, string> = {};
    for (const key of headerKeys) {
      const val = rows[0][key];
      preview[key] = val == null || val === '' ? '' : String(val).slice(0, 60);
    }

    const mapping: Record<string, string | null> = {};
    for (const key of headerKeys) {
      mapping[key] = COLUMNS[this.normalizeCol(key)] ?? null;
    }

    const unrecognized = headerKeys.filter((k) => mapping[k] === null);
    const mapped = new Set(Object.values(mapping).filter(Boolean) as string[]);
    const missing = REQUIRED_FIELDS.filter((f) => !mapped.has(f));

    const fileToken = crypto.randomUUID();
    this.fileStore.set(fileToken, {
      buffer,
      filename,
      expiresAt: Date.now() + 600_000,
    });

    return { fileToken, filename, totalRows, columns: headerKeys, mapping, preview, unrecognized, missing };
  }

  async execute(fileToken: string, columnMap: Record<string, string>): Promise<ImportResult> {
    const stored = this.fileStore.get(fileToken);
    if (!stored) {
      throw new BadRequestException('File token expired or invalid. Please re-upload.');
    }
    this.fileStore.delete(fileToken);

    const { rows } = this.parseFile(stored.buffer);
    const colMap = this.validateColumnMap(columnMap);

    const result: ImportResult = { total: rows.length, created: 0, updated: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      try {
        const mapped = this.mapRow(rows[i], colMap);
        if (!mapped.itemNumber) {
          result.errors.push({ row: i + 2, message: 'Missing item number' });
          continue;
        }
        await this.upsertItem(mapped);
        const exists = await this.prisma.item.findUnique({ where: { itemNumber: mapped.itemNumber } });
        if (exists && exists.createdAt.getTime() !== exists.updatedAt.getTime()) {
          result.updated++;
        } else {
          result.created++;
        }
      } catch (err: any) {
        result.errors.push({ row: i + 2, message: err.message ?? 'Unknown error' });
      }
    }

    return result;
  }

  private parseFile(buffer: Buffer): { headerKeys: string[]; rows: Record<string, unknown>[] } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('No sheets found in file');
    }
    const sheet = workbook.Sheets[sheetName];
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawRows.length === 0) {
      throw new BadRequestException('No data rows found in file');
    }

    const knownCols = new Set(Object.keys(COLUMNS));
    let headerRowIndex = -1;
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i] ?? [];
      const matches = row.filter((c) => {
        if (typeof c !== 'string') return false;
        return knownCols.has(this.normalizeCol(c));
      }).length;
      if (matches >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const headerKeys: string[] = rawRows[headerRowIndex].map((c) => String(c).trim());
    const dataRows = rawRows
      .slice(headerRowIndex + 1)
      .filter((r) => r.some((c) => c != null && c !== ''));

    const rows: Record<string, unknown>[] = dataRows.map((row) => {
      const obj: Record<string, unknown> = {};
      headerKeys.forEach((key, i) => {
        obj[key] = row[i] ?? '';
      });
      return obj;
    });

    return { headerKeys, rows };
  }

  private normalizeCol(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s*([\/\-\–\—\(\)])\s*/g, '$1');
  }

  private validateColumnMap(columnMap: Record<string, string>): Record<string, string> {
    const valid = new Set(FIELDS.map((f) => f.value));
    const map: Record<string, string> = {};
    for (const [header, field] of Object.entries(columnMap)) {
      if (!field) continue;
      if (!valid.has(field)) {
        throw new BadRequestException(`Invalid field "${field}" mapped from column "${header}"`);
      }
      map[header] = field;
    }

    const mappedFields = new Set(Object.values(map));
    for (const f of REQUIRED_FIELDS) {
      if (!mappedFields.has(f)) {
        throw new BadRequestException(`Required field "${f}" is not mapped to any column`);
      }
    }

    return map;
  }

  static getFields() {
    return FIELDS;
  }

  private cleanExpired() {
    const now = Date.now();
    for (const [token, stored] of this.fileStore) {
      if (stored.expiresAt < now) this.fileStore.delete(token);
    }
  }

  private mapRow(raw: Record<string, unknown>, colMap: Record<string, string>): ImportRow {
    const get = (field: string): unknown => {
      for (const [header, mapped] of Object.entries(colMap)) {
        if (mapped === field) return raw[header];
      }
      return undefined;
    };

    const str = (field: string): string | undefined => {
      const v = get(field);
      if (v == null || v === '') return undefined;
      return String(v).trim();
    };

    const num = (field: string): number | undefined => {
      const v = get(field);
      if (v == null || v === '') return undefined;
      if (typeof v === 'number') return v;
      const cleaned = String(v).replace(/[$,]/g, '').trim();
      const n = parseFloat(cleaned);
      return isNaN(n) ? undefined : n;
    };

    const bool = (field: string): boolean | undefined => {
      const v = get(field);
      if (v == null || v === '') return undefined;
      const s = String(v).trim().toLowerCase();
      return s === 'x' || s === 'yes' || s === 'true' || s === '1';
    };

    return {
      itemNumber: str('itemNumber') ?? '',
      description: str('description') ?? '',
      dateAdded: str('dateAdded'),
      onHand: num('onHand'),
      lastQtyInOut: num('lastQtyInOut'),
      unitPrice: num('unitPrice'),
      jobNumber: str('jobNumber'),
      dateDisbursed: str('dateDisbursed'),
      totalCost: num('totalCost'),
      unit: str('unit'),
      locationName: str('locationName'),
      analysisCode: str('analysisCode'),
      vendorName: str('vendorName'),
      weightPerUnit: num('weightPerUnit'),
      categoryName: str('categoryName'),
      subCategoryName: str('subCategoryName'),
      headType: str('headType'),
      removeFlag: bool('removeFlag'),
      labelPrinted: bool('labelPrinted'),
    };
  }

  private parseDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
    const parts = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (parts) {
      const parsed = new Date(`${parts[3]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return undefined;
  }

  private async upsertItem(mapped: ImportRow) {
    const vendorId = mapped.vendorName
      ? (await this.prisma.vendor.upsert({
          where: { name: mapped.vendorName },
          create: { name: mapped.vendorName },
          update: {},
        })).id
      : undefined;

    const locationId = mapped.locationName
      ? (await this.prisma.location.upsert({
          where: { name: mapped.locationName },
          create: { name: mapped.locationName },
          update: {},
        })).id
      : undefined;

    let categoryId: number | undefined;
    let subCategoryId: number | undefined;

    if (mapped.categoryName) {
      const cat = await this.prisma.itemCategory.upsert({
        where: { name: mapped.categoryName },
        create: { name: mapped.categoryName },
        update: {},
      });
      categoryId = cat.id;

      if (mapped.subCategoryName) {
        const sub = await this.prisma.itemSubCategory.upsert({
          where: { name_itemCategoryId: { name: mapped.subCategoryName, itemCategoryId: cat.id } },
          create: { name: mapped.subCategoryName, itemCategoryId: cat.id },
          update: {},
        });
        subCategoryId = sub.id;
      }
    }

    const existing = await this.prisma.item.findUnique({ where: { itemNumber: mapped.itemNumber } });

    const data: any = {
      description: mapped.description,
      unit: mapped.unit,
      unitPrice: mapped.unitPrice,
      weightPerUnit: mapped.weightPerUnit,
      analysisCode: mapped.analysisCode,
      removeFlag: mapped.removeFlag ?? false,
      labelPrinted: mapped.labelPrinted ?? false,
      categoryId,
      subCategoryId,
      headType: mapped.headType,
      locationId,
      vendorId,
      onHand: mapped.onHand ?? 0,
      lastQtyInOut: mapped.lastQtyInOut,
      lastJobNumber: mapped.jobNumber,
      dateAdded: this.parseDate(mapped.dateAdded),
      dateDisbursed: this.parseDate(mapped.dateDisbursed),
      totalCost: mapped.totalCost,
    };

    if (existing) {
      await this.prisma.item.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.item.create({ data: { itemNumber: mapped.itemNumber, ...data } });
    }
  }
}
