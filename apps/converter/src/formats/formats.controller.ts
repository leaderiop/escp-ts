import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  FormatsResponse,
  FormatsResponseDto,
  PAGE_SIZE_PRESETS,
} from '../schemas/conversion.schema';

@ApiTags('formats')
@Controller('api/v1/formats')
export class FormatsController {
  @Get()
  @ApiOperation({
    summary: 'List supported formats and options',
    description: `
Returns all supported output formats, page sizes, printer modes, and conversion options.

Use this endpoint to discover:
- Available output formats (PDF, PNG)
- Predefined page size presets
- Custom page size format
- Printer emulation modes
- Line feed options
- All configurable options with their defaults
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported formats and options',
    type: FormatsResponseDto,
  })
  getFormats(): FormatsResponse {
    const pageSizes = Object.entries(PAGE_SIZE_PRESETS).map(([name, preset]) => ({
      name,
      label: preset.label,
      width: preset.width,
      height: preset.height,
      unit: 'mm' as const,
      ...('description' in preset ? { description: preset.description } : {}),
    }));

    return {
      outputFormats: [
        {
          format: 'pdf',
          contentType: 'application/pdf',
          extension: '.pdf',
          description: 'Portable Document Format - ideal for printing and archiving',
        },
        {
          format: 'png',
          contentType: 'image/png',
          extension: '.png',
          description: 'PNG image - suitable for web display and preview',
        },
      ],
      pageSizes,
      customPageSize: {
        pattern: 'W,H',
        unit: 'mm',
        example: '377,217',
        description: 'Custom dimensions in millimeters (width,height)',
      },
      printerModes: [
        {
          mode: '24pin',
          description: 'ESC/P2 24-pin mode - high quality output (default)',
        },
        {
          mode: '9pin',
          description: 'ESC/P 9-pin mode - legacy dot matrix compatibility',
        },
      ],
      lineFeedModes: [
        {
          mode: 'lf',
          description: 'Unix style (LF) - Line Feed only',
        },
        {
          mode: 'crlf',
          description: 'Windows style (CR+LF) - Carriage Return + Line Feed',
        },
        {
          mode: 'cr',
          description: 'Classic Mac style (CR) - Carriage Return only',
        },
      ],
      options: {
        use8Bit: {
          type: 'boolean',
          default: false,
          description: 'Enable 8-bit character mode for extended ASCII character sets',
        },
        italicsMode: {
          type: 'boolean',
          default: false,
          description: 'Force italics for characters without an italic font variant',
        },
        fontDirection: {
          type: 'enum',
          values: ['horizontal', 'vertical'],
          default: 'horizontal',
          description: 'Text direction - use vertical for some Asian language support',
        },
        dpi: {
          type: 'integer',
          min: 72,
          max: 600,
          default: 150,
          description: 'Resolution for PNG output (does not affect PDF)',
        },
        margins: {
          type: 'object',
          unit: 'mm',
          default: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
          },
          description: 'Page margins in millimeters',
        },
      },
    };
  }
}
