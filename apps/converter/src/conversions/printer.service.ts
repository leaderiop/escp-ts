import { Injectable, Logger } from '@nestjs/common';
import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ConversionOptions, PAGE_SIZE_PRESETS, PageSizePreset } from '../schemas/conversion.schema';

export class PrinterException extends Error {
  constructor(
    message: string,
    public readonly printerError?: string
  ) {
    super(message);
    this.name = 'PrinterException';
  }
}

export interface PrinterOutput {
  buffer: Buffer;
  contentType: 'application/pdf' | 'image/png';
  filename: string;
  pages: number;
  sizeBytes: number;
}

export interface PrinterHealth {
  printerToPDF: boolean;
  fonts: boolean;
}

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly printerPath = process.env.PRINTER_PATH || '/usr/local/bin/printerToPDF';
  private readonly fontPath =
    process.env.FONT_PATH || '/usr/local/share/PrinterToPDF/font2/Epson-Standard.C16';

  /**
   * Convert a PRN buffer to PDF/PNG using PrinterToPDF
   *
   * PrinterToPDF options mapping:
   * - -o: Output directory
   * - -f: Font file path
   * - -p: Page size (preset number or W,H in mm)
   * - -m: Margins (T,R,B,L in mm)
   * - -9: 9-pin ESC/P mode (instead of 24-pin ESC/P2)
   * - -8: 8-bit character mode
   * - -i: Force italics mode
   * - -l: Line feed mode (l=LF, r=CRLF, c=CR)
   * - -d: Font direction (h=horizontal, v=vertical)
   * - -q: Quiet mode
   */
  async convert(prnBuffer: Buffer, options: ConversionOptions): Promise<PrinterOutput> {
    const tempDir = mkdtempSync(join(tmpdir(), 'escp-'));
    this.logger.debug(`Created temp directory: ${tempDir}`);

    try {
      const inputPath = join(tempDir, 'input.prn');
      writeFileSync(inputPath, prnBuffer);
      this.logger.debug(`Wrote PRN file: ${inputPath} (${prnBuffer.length} bytes)`);

      const args = this.buildArgs(tempDir, inputPath, options);
      this.logger.debug(`Executing: ${this.printerPath} ${args.join(' ')}`);

      const result = spawnSync(this.printerPath, args, {
        timeout: 60000,
        encoding: 'utf8',
      });

      if (result.error) {
        throw new PrinterException(
          `Failed to execute printerToPDF: ${result.error.message}`,
          result.error.message
        );
      }

      if (result.status !== 0) {
        const stderr = result.stderr || 'Unknown error';
        throw new PrinterException(`printerToPDF exited with status ${result.status}`, stderr);
      }

      return this.readOutput(tempDir, options);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
      this.logger.debug(`Cleaned up temp directory: ${tempDir}`);
    }
  }

  /**
   * Build command-line arguments for PrinterToPDF
   */
  private buildArgs(tempDir: string, inputPath: string, options: ConversionOptions): string[] {
    const args: string[] = [
      '-o',
      tempDir + '/',
      '-f',
      this.fontPath,
      '-p',
      this.resolvePageSize(options.pageSize),
    ];

    // Add margins if specified
    if (options.margins) {
      const { top, right, bottom, left } = options.margins;
      args.push('-m', `${top},${right},${bottom},${left}`);
    }

    // 9-pin ESC/P mode (default is 24-pin ESC/P2)
    if (options.mode === '9pin') {
      args.push('-9');
    }

    // 8-bit character mode
    if (options.use8Bit) {
      args.push('-8');
    }

    // Force italics mode
    if (options.italicsMode) {
      args.push('-i');
    }

    // Line feed mode
    if (options.lineFeed) {
      const lfMap = { lf: 'l', crlf: 'r', cr: 'c' };
      args.push('-l', lfMap[options.lineFeed]);
    }

    // Font direction
    if (options.fontDirection === 'vertical') {
      args.push('-d', 'v');
    }

    // Quiet mode (suppress verbose output)
    args.push('-q');

    // Input file
    args.push(inputPath);

    return args;
  }

  /**
   * Resolve page size to PrinterToPDF format
   */
  private resolvePageSize(pageSize: string): string {
    // Check if it's a preset
    if (pageSize in PAGE_SIZE_PRESETS) {
      const preset = PAGE_SIZE_PRESETS[pageSize as PageSizePreset];
      return `${preset.width},${preset.height}`;
    }

    // Built-in page sizes for backwards compatibility
    if (pageSize === 'a4') return '0';
    if (pageSize === 'a4-landscape') return '1';

    // Custom size (W,H format)
    return pageSize;
  }

  /**
   * Read conversion output and optionally convert to PNG
   */
  private readOutput(tempDir: string, options: ConversionOptions): PrinterOutput {
    const pdfDir = join(tempDir, 'pdf');

    if (!existsSync(pdfDir)) {
      throw new PrinterException('No output generated - pdf directory not found');
    }

    const pdfFiles = readdirSync(pdfDir)
      .filter((f) => f.endsWith('.pdf'))
      .sort();

    if (pdfFiles.length === 0) {
      throw new PrinterException('No PDF files generated');
    }

    if (options.format === 'pdf') {
      return this.readPdfOutput(pdfDir, pdfFiles);
    }

    return this.convertToPng(tempDir, pdfDir, pdfFiles, options);
  }

  /**
   * Read PDF output (single or multiple pages)
   */
  private readPdfOutput(pdfDir: string, pdfFiles: string[]): PrinterOutput {
    if (pdfFiles.length === 1) {
      const pdfPath = join(pdfDir, pdfFiles[0]!);
      const buffer = readFileSync(pdfPath);
      return {
        buffer,
        contentType: 'application/pdf',
        filename: 'output.pdf',
        pages: 1,
        sizeBytes: buffer.length,
      };
    }

    // Concatenate multiple PDF files
    const buffers: Buffer[] = [];
    for (const file of pdfFiles) {
      buffers.push(readFileSync(join(pdfDir, file)));
    }

    const combinedBuffer = Buffer.concat(buffers);
    return {
      buffer: combinedBuffer,
      contentType: 'application/pdf',
      filename: 'output.pdf',
      pages: pdfFiles.length,
      sizeBytes: combinedBuffer.length,
    };
  }

  /**
   * Convert PDF to PNG using ImageMagick
   */
  private convertToPng(
    tempDir: string,
    pdfDir: string,
    pdfFiles: string[],
    options: ConversionOptions
  ): PrinterOutput {
    const firstPdf = join(pdfDir, pdfFiles[0]!);
    const pngPath = join(tempDir, 'output.png');

    const convertResult = spawnSync(
      'convert',
      ['-density', options.dpi.toString(), firstPdf, '-quality', '100', pngPath],
      {
        timeout: 60000,
        encoding: 'utf8',
      }
    );

    if (convertResult.status !== 0 || !existsSync(pngPath)) {
      throw new PrinterException(
        'Failed to convert PDF to PNG',
        convertResult.stderr || 'ImageMagick conversion failed'
      );
    }

    const buffer = readFileSync(pngPath);
    return {
      buffer,
      contentType: 'image/png',
      filename: 'output.png',
      pages: pdfFiles.length,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Check health of PrinterToPDF dependencies
   */
  checkHealth(): PrinterHealth {
    return {
      printerToPDF: existsSync(this.printerPath),
      fonts: existsSync(this.fontPath),
    };
  }
}
