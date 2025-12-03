import {
  Controller,
  Post,
  Body,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ConversionsService, PrinterException } from './conversions.service';
import {
  ConversionQueryDto,
  ConversionBodyDto,
  ConversionResponseDto,
} from '../schemas/conversion.schema';
import { ProblemDetailsDto, PROBLEM_TYPES } from '../schemas/problem.schema';

@ApiTags('conversions')
@Controller('api/v1/conversions')
export class ConversionsController {
  constructor(private readonly conversionsService: ConversionsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    })
  )
  @ApiOperation({
    summary: 'Create a new conversion',
    description: `
Convert an ESC/P2 PRN file to PDF or PNG format.

## Input Methods
- **Multipart/form-data**: Upload PRN file directly with options as query parameters
- **JSON**: Send base64-encoded PRN content with options in request body

## Response Formats
- **Binary (default)**: Returns the converted file directly
- **JSON**: Set \`Accept: application/json\` header to receive metadata with base64-encoded content

## PrinterToPDF Options
All PrinterToPDF options are exposed through this API:
- **pageSize**: Page dimensions (preset name or custom W,H in mm)
- **margins**: Page margins in mm (top, right, bottom, left)
- **mode**: Printer emulation (24pin ESC/P2 or 9pin ESC/P)
- **lineFeed**: Line ending style (lf, crlf, cr)
- **use8Bit**: Enable 8-bit character mode for extended ASCII
- **italicsMode**: Force italics for fonts without italic variant
- **fontDirection**: horizontal or vertical text direction
    `,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiProduces('application/pdf', 'image/png', 'application/json')
  @ApiBody({
    description: 'PRN file to convert',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'PRN file (multipart/form-data)',
            },
          },
          required: ['file'],
        },
        {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              description: 'Base64-encoded PRN content',
            },
            options: {
              type: 'object',
              properties: {
                format: { type: 'string', enum: ['pdf', 'png'] },
                pageSize: { type: 'string' },
                mode: { type: 'string', enum: ['24pin', '9pin'] },
                dpi: { type: 'number' },
                lineFeed: { type: 'string', enum: ['lf', 'crlf', 'cr'] },
                use8Bit: { type: 'boolean' },
                italicsMode: { type: 'boolean' },
                fontDirection: { type: 'string', enum: ['horizontal', 'vertical'] },
                margins: {
                  type: 'object',
                  properties: {
                    top: { type: 'number' },
                    right: { type: 'number' },
                    bottom: { type: 'number' },
                    left: { type: 'number' },
                  },
                },
              },
            },
          },
          required: ['file'],
        },
      ],
    },
  })
  @ApiQuery({
    name: 'format',
    enum: ['pdf', 'png'],
    required: false,
    description: 'Output format (default: pdf)',
  })
  @ApiQuery({
    name: 'pageSize',
    type: 'string',
    required: false,
    description: 'Page size preset (a4, letter, lq2090) or custom W,H in mm',
  })
  @ApiQuery({
    name: 'mode',
    enum: ['24pin', '9pin'],
    required: false,
    description: 'Printer emulation mode (default: 24pin)',
  })
  @ApiQuery({
    name: 'dpi',
    type: 'number',
    required: false,
    description: 'DPI for PNG output (72-600, default: 150)',
  })
  @ApiQuery({
    name: 'lineFeed',
    enum: ['lf', 'crlf', 'cr'],
    required: false,
    description: 'Line ending style',
  })
  @ApiQuery({
    name: 'use8Bit',
    type: 'boolean',
    required: false,
    description: 'Enable 8-bit character mode',
  })
  @ApiQuery({
    name: 'italicsMode',
    type: 'boolean',
    required: false,
    description: 'Force italics mode',
  })
  @ApiQuery({
    name: 'fontDirection',
    enum: ['horizontal', 'vertical'],
    required: false,
    description: 'Font direction',
  })
  @ApiQuery({
    name: 'marginTop',
    type: 'number',
    required: false,
    description: 'Top margin in mm',
  })
  @ApiQuery({
    name: 'marginRight',
    type: 'number',
    required: false,
    description: 'Right margin in mm',
  })
  @ApiQuery({
    name: 'marginBottom',
    type: 'number',
    required: false,
    description: 'Bottom margin in mm',
  })
  @ApiQuery({
    name: 'marginLeft',
    type: 'number',
    required: false,
    description: 'Left margin in mm',
  })
  @ApiHeader({
    name: 'Accept',
    required: false,
    description:
      'Response format: application/json for JSON with base64, or default for binary file',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversion created successfully',
    type: ConversionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 413,
    description: 'File too large',
    type: ProblemDetailsDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Conversion failed',
    type: ProblemDetailsDto,
  })
  async createConversion(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: ConversionBodyDto | undefined,
    @Query() query: ConversionQueryDto,
    @Headers('accept') accept: string,
    @Headers('content-type') contentType: string,
    @Res() res: Response
  ): Promise<void> {
    // Determine input source based on content type
    const isJson = contentType?.includes('application/json');

    if (isJson && body?.file) {
      // JSON request with base64 content
      await this.handleJsonConversion(body, accept, res);
    } else if (file) {
      // Multipart upload
      await this.handleMultipartConversion(file, query, accept, res);
    } else {
      throw new HttpException(
        {
          type: PROBLEM_TYPES.VALIDATION_ERROR,
          title: 'Validation Error',
          status: HttpStatus.BAD_REQUEST,
          detail:
            'No file provided. Upload a file via multipart/form-data or send base64 content via JSON.',
          timestamp: new Date().toISOString(),
          errors: [{ pointer: '/file', message: 'File is required' }],
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private async handleMultipartConversion(
    file: Express.Multer.File,
    query: ConversionQueryDto,
    accept: string,
    res: Response
  ): Promise<void> {
    try {
      const result = await this.conversionsService.convertFromBuffer(
        file.buffer,
        query,
        file.originalname
      );

      this.sendResponse(result, accept, res);
    } catch (error) {
      this.handleConversionError(error);
    }
  }

  private async handleJsonConversion(
    body: ConversionBodyDto,
    accept: string,
    res: Response
  ): Promise<void> {
    try {
      const result = await this.conversionsService.convertFromBase64(body.file, body.options ?? {});

      this.sendResponse(result, accept, res);
    } catch (error) {
      this.handleConversionError(error);
    }
  }

  private sendResponse(
    result: Awaited<ReturnType<ConversionsService['convertFromBuffer']>>,
    accept: string,
    res: Response
  ): void {
    if (accept?.includes('application/json')) {
      const jsonResponse = this.conversionsService.buildJsonResponse(result);
      res.status(HttpStatus.CREATED).json(jsonResponse);
    } else {
      res
        .status(HttpStatus.CREATED)
        .set({
          'Content-Type': result.output.contentType,
          'Content-Disposition': `attachment; filename="${result.output.filename}"`,
          'Content-Length': result.output.sizeBytes.toString(),
          'X-Conversion-Id': result.response.conversion.id,
          'X-Processing-Time-Ms': result.response.conversion.processingTimeMs.toString(),
          'X-Page-Count': result.output.pages.toString(),
        })
        .send(result.output.buffer);
    }
  }

  private handleConversionError(error: unknown): never {
    if (error instanceof PrinterException) {
      throw new HttpException(
        {
          type: PROBLEM_TYPES.CONVERSION_FAILED,
          title: 'Conversion Failed',
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          detail: error.message,
          timestamp: new Date().toISOString(),
          printerError: error.printerError,
        },
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    throw new HttpException(
      {
        type: PROBLEM_TYPES.INTERNAL_ERROR,
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
