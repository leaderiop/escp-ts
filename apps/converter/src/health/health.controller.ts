import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync, accessSync, constants, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

interface ComponentHealth {
  status: 'up' | 'down';
  path?: string;
  writable?: boolean;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  components: {
    printerToPDF: ComponentHealth;
    fonts: ComponentHealth;
    tempDirectory: ComponentHealth;
  };
}

@ApiTags('health')
@Controller('api/v1/health')
export class HealthController {
  private readonly printerPath = process.env.PRINTER_PATH || '/usr/local/bin/printerToPDF';
  private readonly fontPath =
    process.env.FONT_PATH || '/usr/local/share/PrinterToPDF/font2/Epson-Standard.C16';
  private readonly version = process.env.npm_package_version || '1.0.0';

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check the health status of the converter service and all its dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy'] },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
        components: {
          type: 'object',
          properties: {
            printerToPDF: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['up', 'down'] },
                path: { type: 'string' },
              },
            },
            fonts: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['up', 'down'] },
                path: { type: 'string' },
              },
            },
            tempDirectory: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['up', 'down'] },
                writable: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy - one or more components are down',
  })
  checkHealth(@Res() res: Response): void {
    const components = {
      printerToPDF: this.checkPrinterToPDF(),
      fonts: this.checkFonts(),
      tempDirectory: this.checkTempDirectory(),
    };

    const isHealthy = Object.values(components).every((component) => component.status === 'up');

    const response: HealthResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: this.version,
      components,
    };

    res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(response);
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Simple liveness check - returns 200 if the service is running.',
  })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness(): { status: string } {
    return { status: 'alive' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Readiness check - returns 200 if the service is ready to accept requests.',
  })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  readiness(@Res() res: Response): void {
    const printerReady = existsSync(this.printerPath);
    const fontsReady = existsSync(this.fontPath);

    if (printerReady && fontsReady) {
      res.status(HttpStatus.OK).json({ status: 'ready' });
    } else {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        missing: {
          printerToPDF: !printerReady,
          fonts: !fontsReady,
        },
      });
    }
  }

  private checkPrinterToPDF(): ComponentHealth {
    try {
      if (existsSync(this.printerPath)) {
        accessSync(this.printerPath, constants.X_OK);
        return { status: 'up', path: this.printerPath };
      }
      return {
        status: 'down',
        path: this.printerPath,
        error: 'Binary not found',
      };
    } catch (error) {
      return {
        status: 'down',
        path: this.printerPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkFonts(): ComponentHealth {
    try {
      if (existsSync(this.fontPath)) {
        return { status: 'up', path: this.fontPath };
      }
      return {
        status: 'down',
        path: this.fontPath,
        error: 'Font file not found',
      };
    } catch (error) {
      return {
        status: 'down',
        path: this.fontPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkTempDirectory(): ComponentHealth {
    const testFile = join(tmpdir(), `escp-health-${Date.now()}.tmp`);
    try {
      writeFileSync(testFile, 'health');
      unlinkSync(testFile);
      return { status: 'up', writable: true };
    } catch (error) {
      return {
        status: 'down',
        writable: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
