import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';

const TOOL_COLUMNS: Record<string, string> = {
  'name': 'name',
  'tool name': 'name',
  'tool': 'name',
  'description': 'description',
  'desc': 'description',
  'he #': 'heNumber',
  'he#': 'heNumber',
  'he number': 'heNumber',
  'he num': 'heNumber',
  'serial number': 'serialNumber',
  'serial #': 'serialNumber',
  'serial#': 'serialNumber',
  's/n': 'serialNumber',
  'sn': 'serialNumber',
  'vendor': 'vendorName',
  'vendor name': 'vendorName',
  'supplier': 'vendorName',
  'location': 'locationName',
  'loc': 'locationName',
  'notes': 'notes',
  'note': 'notes',
  'image url': 'imageUrl',
  'image': 'imageUrl',
  'photo': 'imageUrl',
};

const TOOL_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'description', label: 'Description', required: false },
  { value: 'heNumber', label: 'HE #', required: false },
  { value: 'serialNumber', label: 'Serial Number', required: false },
  { value: 'vendorName', label: 'Vendor', required: false },
  { value: 'locationName', label: 'Location', required: false },
  { value: 'notes', label: 'Notes', required: false },
  { value: 'imageUrl', label: 'Image URL', required: false },
];

const REQUIRED_FIELDS = ['name'];

interface StoredFile {
  buffer: Buffer;
  filename: string;
  expiresAt: number;
}

interface ImportRow {
  name: string;
  description?: string;
  heNumber?: number;
  serialNumber?: string;
  vendorName?: string;
  locationName?: string;
  notes?: string;
  imageUrl?: string;
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
  errors: { row: number; message: string }[];
}

@Injectable()
export class ToolImportService {
  private fileStore = new Map<string, StoredFile>();

  constructor(private readonly prisma: PrismaService) {
    setInterval(() => this.cleanExpired(), 60_000);
  }

  static getFields() {
    return TOOL_FIELDS;
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
      mapping[key] = TOOL_COLUMNS[this.normalizeCol(key)] ?? null;
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

    const { rows, headerRowIndex } = this.parseFile(stored.buffer);
    const colMap = this.validateColumnMap(columnMap);

    const result: ImportResult = { total: rows.length, created: 0, errors: [] };
    const rowOffset = headerRowIndex + 2;

    for (let i = 0; i < rows.length; i++) {
      try {
        const mapped = this.mapRow(rows[i], colMap);
        if (!mapped.name) {
          result.errors.push({ row: i + rowOffset, message: 'Missing name' });
          continue;
        }
        await this.upsertTool(mapped);
        result.created++;
      } catch (err: any) {
        result.errors.push({ row: i + rowOffset, message: err.message ?? 'Unknown error' });
      }
    }

    return result;
  }

  private parseFile(buffer: Buffer): { headerKeys: string[]; rows: Record<string, unknown>[]; headerRowIndex: number } {
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

    const knownCols = new Set(Object.keys(TOOL_COLUMNS));
    let headerRowIndex = -1;
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i] ?? [];
      const matches = row.filter((c) => {
        if (typeof c !== 'string') return false;
        return knownCols.has(this.normalizeCol(c));
      });
      if (matches.length >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const headerKeys: string[] = (rawRows[headerRowIndex] ?? []).map((c) => String(c ?? ''));
    const rows: Record<string, unknown>[] = [];
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const rawRow = rawRows[i] ?? [];
      const row: Record<string, unknown> = {};
      for (let j = 0; j < headerKeys.length; j++) {
        row[headerKeys[j]] = rawRow[j] ?? '';
      }
      const hasData = Object.values(row).some((v) => v !== '' && v !== null && v !== undefined);
      if (hasData) {
        rows.push(row);
      }
    }

    return { headerKeys, rows, headerRowIndex };
  }

  private normalizeCol(name: string): string {
    return name.trim().toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s*([\/\-\–\—\(\)])\s*/g, '$1');
  }

  private validateColumnMap(columnMap: Record<string, string>): Record<string, string> {
    const validFields = new Set(TOOL_FIELDS.map((f) => f.value));
    const colMap: Record<string, string> = {};
    for (const [col, field] of Object.entries(columnMap)) {
      if (!field) continue;
      if (!validFields.has(field)) {
        throw new BadRequestException(`Invalid field "${field}" for column "${col}"`);
      }
      colMap[col] = field;
    }
    const mappedFields = new Set(Object.values(colMap));
    for (const f of REQUIRED_FIELDS) {
      if (!mappedFields.has(f)) {
        throw new BadRequestException(`Required field "${f}" is not mapped to any column`);
      }
    }
    return colMap;
  }

  private mapRow(row: Record<string, unknown>, colMap: Record<string, string>): ImportRow {
    const result: ImportRow = { name: '' };
    for (const [col, field] of Object.entries(colMap)) {
      const raw = row[col];
      const val = raw == null ? '' : String(raw).trim();
      if (val === '') continue;
      switch (field) {
        case 'name':
          result.name = val;
          break;
        case 'description':
          result.description = val;
          break;
        case 'heNumber':
          result.heNumber = parseInt(val, 10) || undefined;
          break;
        case 'serialNumber':
          result.serialNumber = val;
          break;
        case 'vendorName':
          result.vendorName = val;
          break;
        case 'locationName':
          result.locationName = val;
          break;
        case 'notes':
          result.notes = val;
          break;
        case 'imageUrl':
          result.imageUrl = val;
          break;
      }
    }
    return result;
  }

  private async upsertTool(row: ImportRow) {
    let vendorId: number | undefined;
    if (row.vendorName) {
      const vendor = await this.prisma.vendor.upsert({
        where: { name: row.vendorName },
        create: { name: row.vendorName },
        update: {},
      });
      vendorId = vendor.id;
    }

    let locationId: number | undefined;
    if (row.locationName) {
      const location = await this.prisma.location.upsert({
        where: { name: row.locationName },
        create: { name: row.locationName },
        update: {},
      });
      locationId = location.id;
    }

    await this.prisma.tool.create({
      data: {
        name: row.name,
        description: row.description,
        heNumber: row.heNumber,
        serialNumber: row.serialNumber,
        notes: row.notes,
        imageUrl: row.imageUrl,
        vendorId,
        locationId,
      },
    });
  }

  private cleanExpired() {
    const now = Date.now();
    for (const [key, file] of this.fileStore) {
      if (file.expiresAt < now) {
        this.fileStore.delete(key);
      }
    }
  }
}
