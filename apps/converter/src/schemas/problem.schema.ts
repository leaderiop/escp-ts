import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * RFC 7807 Problem Details for HTTP APIs
 * https://datatracker.ietf.org/doc/html/rfc7807
 */

export const ValidationErrorItemSchema = z.object({
  /** JSON pointer to the field with the error */
  pointer: z.string(),
  /** Human-readable error message */
  message: z.string(),
  /** Value that was received */
  received: z.unknown().optional(),
});

export type ValidationErrorItem = z.infer<typeof ValidationErrorItemSchema>;

export const ProblemDetailsSchema = z.object({
  /** URI reference identifying the problem type */
  type: z.string().url(),
  /** Short, human-readable summary */
  title: z.string(),
  /** HTTP status code */
  status: z.number().int().min(400).max(599),
  /** Human-readable explanation specific to this occurrence */
  detail: z.string(),
  /** URI reference identifying the specific occurrence */
  instance: z.string().optional(),
  /** ISO 8601 timestamp */
  timestamp: z.string().datetime(),
  /** Request ID for tracing */
  requestId: z.string().optional(),
  /** Validation errors array */
  errors: z.array(ValidationErrorItemSchema).optional(),
  /** Raw error from PrinterToPDF */
  printerError: z.string().optional(),
  /** Maximum allowed file size */
  maxSizeBytes: z.number().int().optional(),
  /** Received file size */
  receivedSizeBytes: z.number().int().optional(),
  /** Retry-After value in seconds */
  retryAfter: z.number().int().optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

export class ProblemDetailsDto extends createZodDto(ProblemDetailsSchema) {}

/**
 * Problem type URIs following a consistent naming pattern
 */
export const PROBLEM_TYPES = {
  /** Request validation failed */
  VALIDATION_ERROR: 'https://api.escp.dev/problems/validation-error',
  /** Uploaded file exceeds size limit */
  FILE_TOO_LARGE: 'https://api.escp.dev/problems/file-too-large',
  /** Content-Type not supported */
  UNSUPPORTED_MEDIA_TYPE: 'https://api.escp.dev/problems/unsupported-media-type',
  /** PRN to PDF/PNG conversion failed */
  CONVERSION_FAILED: 'https://api.escp.dev/problems/conversion-failed',
  /** Resource not found */
  NOT_FOUND: 'https://api.escp.dev/problems/not-found',
  /** Server error */
  INTERNAL_ERROR: 'https://api.escp.dev/problems/internal-error',
  /** Service temporarily unavailable */
  SERVICE_UNAVAILABLE: 'https://api.escp.dev/problems/service-unavailable',
} as const;
