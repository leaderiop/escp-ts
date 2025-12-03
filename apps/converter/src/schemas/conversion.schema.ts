import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// =============================================================================
// Page Size Configuration
// =============================================================================

export const PAGE_SIZE_PRESETS = {
  a4: { width: 210, height: 297, label: 'A4 Portrait' },
  'a4-landscape': { width: 297, height: 210, label: 'A4 Landscape' },
  letter: { width: 215.9, height: 279.4, label: 'US Letter' },
  legal: { width: 215.9, height: 355.6, label: 'US Legal' },
  lq2090: {
    width: 377,
    height: 217,
    label: 'EPSON LQ-2090II Wide',
    description: 'Standard wide format (1069x615 points)',
  },
  'lq2090-long': {
    width: 377,
    height: 559,
    label: 'EPSON LQ-2090II Long',
    description: 'Extended length format',
  },
} as const;

export type PageSizePreset = keyof typeof PAGE_SIZE_PRESETS;

// =============================================================================
// Enums and Constants
// =============================================================================

/** Output format for conversion */
export const OutputFormatSchema = z.enum(['pdf', 'png']);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

/** Printer emulation mode */
export const PrinterModeSchema = z.enum(['24pin', '9pin']);
export type PrinterMode = z.infer<typeof PrinterModeSchema>;

/** Line ending style for text output */
export const LineFeedModeSchema = z.enum(['lf', 'crlf', 'cr']);
export type LineFeedMode = z.infer<typeof LineFeedModeSchema>;

/** Font direction for vertical printing support */
export const FontDirectionSchema = z.enum(['horizontal', 'vertical']);
export type FontDirection = z.infer<typeof FontDirectionSchema>;

// =============================================================================
// Page Size Schema
// =============================================================================

const PageSizePresetSchema = z.enum([
  'a4',
  'a4-landscape',
  'letter',
  'legal',
  'lq2090',
  'lq2090-long',
]);

const CustomPageSizeSchema = z.string().regex(/^\d+(\.\d+)?,\d+(\.\d+)?$/, {
  message: 'Custom page size must be in format W,H in mm (e.g., "377,217")',
});

export const PageSizeSchema = z.union([PageSizePresetSchema, CustomPageSizeSchema]);

// =============================================================================
// Margin Schema
// =============================================================================

/** Margins in millimeters */
export const MarginsSchema = z.object({
  top: z.number().min(0).max(100).default(10),
  right: z.number().min(0).max(100).default(10),
  bottom: z.number().min(0).max(100).default(10),
  left: z.number().min(0).max(100).default(10),
});

export type Margins = z.infer<typeof MarginsSchema>;

// =============================================================================
// Conversion Options Schema
// =============================================================================

/**
 * Full conversion options matching PrinterToPDF capabilities:
 * - pageSize: Page dimensions (preset or custom W,H in mm)
 * - margins: Page margins in mm
 * - mode: Printer emulation mode (24pin ESC/P2 or 9pin ESC/P)
 * - lineFeed: Line ending style (Unix LF, Windows CRLF, or Classic Mac CR)
 * - use8Bit: Enable 8-bit character mode for extended character sets
 * - italicsMode: Force italics for characters without italic variant
 * - fontDirection: Font direction for vertical text support
 */
export const ConversionOptionsSchema = z.object({
  /** Output format */
  format: OutputFormatSchema.default('pdf'),

  /** Page size preset or custom dimensions (W,H in mm) */
  pageSize: PageSizeSchema.default('a4'),

  /** Page margins in mm */
  margins: MarginsSchema.optional(),

  /** Printer emulation mode */
  mode: PrinterModeSchema.default('24pin'),

  /** DPI for PNG output (72-600) */
  dpi: z.number().int().min(72).max(600).default(150),

  /** Line ending style */
  lineFeed: LineFeedModeSchema.optional(),

  /** Enable 8-bit character mode for extended ASCII */
  use8Bit: z.boolean().default(false),

  /** Force italics mode for fonts without italic variant */
  italicsMode: z.boolean().default(false),

  /** Font direction (horizontal or vertical) */
  fontDirection: FontDirectionSchema.default('horizontal'),
});

export type ConversionOptions = z.infer<typeof ConversionOptionsSchema>;

// =============================================================================
// Request Schemas
// =============================================================================

/** Query parameters for multipart/form-data conversion */
export const ConversionQuerySchema = z.object({
  format: OutputFormatSchema.default('pdf'),
  pageSize: PageSizeSchema.default('a4'),
  mode: PrinterModeSchema.default('24pin'),
  dpi: z.coerce.number().int().min(72).max(600).default(150),
  lineFeed: LineFeedModeSchema.optional(),
  use8Bit: z.coerce.boolean().default(false),
  italicsMode: z.coerce.boolean().default(false),
  fontDirection: FontDirectionSchema.default('horizontal'),
  marginTop: z.coerce.number().min(0).max(100).optional(),
  marginRight: z.coerce.number().min(0).max(100).optional(),
  marginBottom: z.coerce.number().min(0).max(100).optional(),
  marginLeft: z.coerce.number().min(0).max(100).optional(),
});

export type ConversionQuery = z.infer<typeof ConversionQuerySchema>;

/** JSON body for application/json conversion */
export const ConversionBodySchema = z.object({
  /** Base64-encoded PRN file content */
  file: z.string().min(1, 'File content is required'),
  /** Conversion options */
  options: ConversionOptionsSchema.optional(),
});

export type ConversionBody = z.infer<typeof ConversionBodySchema>;

// =============================================================================
// Response Schemas
// =============================================================================

/** Metadata about the conversion operation */
export const ConversionMetadataSchema = z.object({
  /** Unique conversion ID */
  id: z.string().uuid(),
  /** Conversion status */
  status: z.enum(['completed', 'failed']),
  /** Time taken for conversion in milliseconds */
  processingTimeMs: z.number().int().nonnegative(),
  /** Timestamp when conversion was created */
  createdAt: z.string().datetime(),
});

export type ConversionMetadata = z.infer<typeof ConversionMetadataSchema>;

/** Input file information */
export const InputFileSchema = z.object({
  /** Original filename if provided */
  filename: z.string().optional(),
  /** Input file size in bytes */
  sizeBytes: z.number().int().positive(),
});

export type InputFile = z.infer<typeof InputFileSchema>;

/** Output file information */
export const OutputFileSchema = z.object({
  /** Generated filename */
  filename: z.string(),
  /** MIME type */
  contentType: z.enum(['application/pdf', 'image/png']),
  /** Output file size in bytes */
  sizeBytes: z.number().int().positive(),
  /** Number of pages generated */
  pages: z.number().int().positive(),
  /** Base64-encoded content (only in JSON response) */
  content: z.string().optional(),
});

export type OutputFile = z.infer<typeof OutputFileSchema>;

/** Effective options used for conversion */
export const EffectiveOptionsSchema = z.object({
  format: OutputFormatSchema,
  pageSize: z.string(),
  pageSizeMm: z.object({
    width: z.number(),
    height: z.number(),
  }),
  mode: PrinterModeSchema,
  dpi: z.number().int(),
  margins: MarginsSchema.optional(),
  lineFeed: LineFeedModeSchema.optional(),
  use8Bit: z.boolean(),
  italicsMode: z.boolean(),
  fontDirection: FontDirectionSchema,
});

export type EffectiveOptions = z.infer<typeof EffectiveOptionsSchema>;

/** Complete conversion response */
export const ConversionResponseSchema = z.object({
  /** Conversion metadata */
  conversion: ConversionMetadataSchema,
  /** Input file information */
  input: InputFileSchema,
  /** Output file information */
  output: OutputFileSchema,
  /** Options used for conversion */
  options: EffectiveOptionsSchema,
});

export type ConversionResponse = z.infer<typeof ConversionResponseSchema>;

// =============================================================================
// DTOs for NestJS
// =============================================================================

export class ConversionQueryDto extends createZodDto(ConversionQuerySchema) {}
export class ConversionBodyDto extends createZodDto(ConversionBodySchema) {}
export class ConversionResponseDto extends createZodDto(ConversionResponseSchema) {}

// =============================================================================
// Formats Response Schema
// =============================================================================

export const FormatInfoSchema = z.object({
  format: OutputFormatSchema,
  contentType: z.string(),
  extension: z.string(),
  description: z.string(),
});

export const PageSizeInfoSchema = z.object({
  name: z.string(),
  label: z.string(),
  width: z.number(),
  height: z.number(),
  unit: z.literal('mm'),
  description: z.string().optional(),
});

export const FormatsResponseSchema = z.object({
  outputFormats: z.array(FormatInfoSchema),
  pageSizes: z.array(PageSizeInfoSchema),
  customPageSize: z.object({
    pattern: z.literal('W,H'),
    unit: z.literal('mm'),
    example: z.string(),
    description: z.string(),
  }),
  printerModes: z.array(
    z.object({
      mode: PrinterModeSchema,
      description: z.string(),
    })
  ),
  lineFeedModes: z.array(
    z.object({
      mode: LineFeedModeSchema,
      description: z.string(),
    })
  ),
  options: z.object({
    use8Bit: z.object({
      type: z.literal('boolean'),
      default: z.boolean(),
      description: z.string(),
    }),
    italicsMode: z.object({
      type: z.literal('boolean'),
      default: z.boolean(),
      description: z.string(),
    }),
    fontDirection: z.object({
      type: z.literal('enum'),
      values: z.array(FontDirectionSchema),
      default: FontDirectionSchema,
      description: z.string(),
    }),
    dpi: z.object({
      type: z.literal('integer'),
      min: z.number(),
      max: z.number(),
      default: z.number(),
      description: z.string(),
    }),
    margins: z.object({
      type: z.literal('object'),
      unit: z.literal('mm'),
      default: MarginsSchema,
      description: z.string(),
    }),
  }),
});

export type FormatsResponse = z.infer<typeof FormatsResponseSchema>;
export class FormatsResponseDto extends createZodDto(FormatsResponseSchema) {}
