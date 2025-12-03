import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrinterService, PrinterOutput, PrinterException } from './printer.service';
import {
  ConversionOptions,
  ConversionQuery,
  ConversionResponse,
  ConversionMetadata,
  InputFile,
  OutputFile,
  EffectiveOptions,
  PAGE_SIZE_PRESETS,
  PageSizePreset,
  Margins,
} from '../schemas/conversion.schema';

export { PrinterException };

export interface ConversionResult {
  response: ConversionResponse;
  output: PrinterOutput;
}

@Injectable()
export class ConversionsService {
  private readonly logger = new Logger(ConversionsService.name);

  constructor(private readonly printerService: PrinterService) {}

  /**
   * Convert a PRN file from a Buffer (multipart upload)
   */
  async convertFromBuffer(
    buffer: Buffer,
    query: ConversionQuery,
    filename?: string
  ): Promise<ConversionResult> {
    const options = this.queryToOptions(query);
    return this.executeConversion(buffer, options, filename);
  }

  /**
   * Convert a PRN file from Base64 (JSON request)
   */
  async convertFromBase64(
    base64Content: string,
    options: Partial<ConversionOptions>,
    filename?: string
  ): Promise<ConversionResult> {
    const buffer = Buffer.from(base64Content, 'base64');
    const fullOptions = this.mergeWithDefaults(options);
    return this.executeConversion(buffer, fullOptions, filename);
  }

  /**
   * Execute the conversion and build response
   */
  private async executeConversion(
    buffer: Buffer,
    options: ConversionOptions,
    filename?: string
  ): Promise<ConversionResult> {
    const id = randomUUID();
    const startTime = Date.now();

    this.logger.log(
      `Starting conversion ${id}: format=${options.format}, pageSize=${options.pageSize}, mode=${options.mode}`
    );

    try {
      const output = await this.printerService.convert(buffer, options);
      const processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `Conversion ${id} completed in ${processingTimeMs}ms: ${output.sizeBytes} bytes, ${output.pages} pages`
      );

      const response = this.buildResponse(
        id,
        buffer.length,
        output,
        options,
        processingTimeMs,
        filename
      );

      return { response, output };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      this.logger.error(
        `Conversion ${id} failed after ${processingTimeMs}ms: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Convert query parameters to ConversionOptions
   */
  private queryToOptions(query: ConversionQuery): ConversionOptions {
    const margins: Margins | undefined =
      query.marginTop !== undefined ||
      query.marginRight !== undefined ||
      query.marginBottom !== undefined ||
      query.marginLeft !== undefined
        ? {
            top: query.marginTop ?? 10,
            right: query.marginRight ?? 10,
            bottom: query.marginBottom ?? 10,
            left: query.marginLeft ?? 10,
          }
        : undefined;

    return {
      format: query.format,
      pageSize: query.pageSize,
      mode: query.mode,
      dpi: query.dpi,
      lineFeed: query.lineFeed,
      use8Bit: query.use8Bit,
      italicsMode: query.italicsMode,
      fontDirection: query.fontDirection,
      margins,
    };
  }

  /**
   * Merge partial options with defaults
   */
  private mergeWithDefaults(partial: Partial<ConversionOptions>): ConversionOptions {
    return {
      format: partial.format ?? 'pdf',
      pageSize: partial.pageSize ?? 'a4',
      mode: partial.mode ?? '24pin',
      dpi: partial.dpi ?? 150,
      lineFeed: partial.lineFeed,
      use8Bit: partial.use8Bit ?? false,
      italicsMode: partial.italicsMode ?? false,
      fontDirection: partial.fontDirection ?? 'horizontal',
      margins: partial.margins,
    };
  }

  /**
   * Build the conversion response object
   */
  private buildResponse(
    id: string,
    inputSizeBytes: number,
    output: PrinterOutput,
    options: ConversionOptions,
    processingTimeMs: number,
    filename?: string
  ): ConversionResponse {
    const conversion: ConversionMetadata = {
      id,
      status: 'completed',
      processingTimeMs,
      createdAt: new Date().toISOString(),
    };

    const input: InputFile = {
      filename,
      sizeBytes: inputSizeBytes,
    };

    const outputFile: OutputFile = {
      filename: output.filename,
      contentType: output.contentType,
      sizeBytes: output.sizeBytes,
      pages: output.pages,
    };

    const effectiveOptions: EffectiveOptions = {
      format: options.format,
      pageSize: options.pageSize,
      pageSizeMm: this.resolvePageSizeMm(options.pageSize),
      mode: options.mode,
      dpi: options.dpi,
      margins: options.margins,
      lineFeed: options.lineFeed,
      use8Bit: options.use8Bit,
      italicsMode: options.italicsMode,
      fontDirection: options.fontDirection,
    };

    return {
      conversion,
      input,
      output: outputFile,
      options: effectiveOptions,
    };
  }

  /**
   * Resolve page size to mm dimensions
   */
  private resolvePageSizeMm(pageSize: string): { width: number; height: number } {
    if (pageSize in PAGE_SIZE_PRESETS) {
      const preset = PAGE_SIZE_PRESETS[pageSize as PageSizePreset];
      return { width: preset.width, height: preset.height };
    }

    // Parse custom size
    const match = pageSize.match(/^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
    if (match) {
      return {
        width: parseFloat(match[1]!),
        height: parseFloat(match[2]!),
      };
    }

    // Default to A4
    return { width: 210, height: 297 };
  }

  /**
   * Build JSON response with base64 content
   */
  buildJsonResponse(result: ConversionResult): ConversionResponse {
    return {
      ...result.response,
      output: {
        ...result.response.output,
        content: result.output.buffer.toString('base64'),
      },
    };
  }
}
