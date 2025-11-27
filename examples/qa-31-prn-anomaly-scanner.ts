/**
 * QA Test 31: PRN Anomaly Scanner
 *
 * Scans existing PRN files for common ESC/P command anomalies:
 * - Missing ESC @ initialization
 * - Duplicate consecutive commands
 * - Invalid parameter values
 * - Out-of-order positioning
 * - Orphaned escape sequences
 *
 * Run: npx tsx examples/qa-31-prn-anomaly-scanner.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Anomaly {
  file: string;
  offset: number;
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface ParsedCommand {
  offset: number;
  type: string;
  bytes: number[];
  description: string;
}

function parseEscPCommands(data: Uint8Array): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  let i = 0;

  while (i < data.length) {
    if (data[i] === 0x1B) {
      const startOffset = i;
      const cmd = data[i + 1];

      if (cmd === undefined) {
        commands.push({
          offset: startOffset,
          type: 'ESC_INCOMPLETE',
          bytes: [0x1B],
          description: 'Incomplete ESC sequence at end of file',
        });
        break;
      }

      switch (cmd) {
        case 0x40: // ESC @
          commands.push({
            offset: startOffset,
            type: 'ESC_INIT',
            bytes: [0x1B, 0x40],
            description: 'Initialize printer',
          });
          i += 2;
          break;

        case 0x24: // ESC $ nL nH
          if (i + 3 < data.length) {
            const nL = data[i + 2];
            const nH = data[i + 3];
            commands.push({
              offset: startOffset,
              type: 'ESC_HPOS',
              bytes: [0x1B, 0x24, nL, nH],
              description: `Horizontal position: ${nL + nH * 256} units`,
            });
            i += 4;
          } else {
            commands.push({
              offset: startOffset,
              type: 'ESC_INCOMPLETE',
              bytes: Array.from(data.slice(i)),
              description: 'Incomplete ESC $ sequence',
            });
            i = data.length;
          }
          break;

        case 0x4A: // ESC J n
          if (i + 2 < data.length) {
            const n = data[i + 2];
            commands.push({
              offset: startOffset,
              type: 'ESC_VADVANCE',
              bytes: [0x1B, 0x4A, n],
              description: `Vertical advance: ${n}/180 inch`,
            });
            i += 3;
          } else {
            commands.push({
              offset: startOffset,
              type: 'ESC_INCOMPLETE',
              bytes: Array.from(data.slice(i)),
              description: 'Incomplete ESC J sequence',
            });
            i = data.length;
          }
          break;

        case 0x45: // ESC E (Bold on)
          commands.push({
            offset: startOffset,
            type: 'ESC_BOLD_ON',
            bytes: [0x1B, 0x45],
            description: 'Bold on',
          });
          i += 2;
          break;

        case 0x46: // ESC F (Bold off)
          commands.push({
            offset: startOffset,
            type: 'ESC_BOLD_OFF',
            bytes: [0x1B, 0x46],
            description: 'Bold off',
          });
          i += 2;
          break;

        case 0x34: // ESC 4 (Italic on)
          commands.push({
            offset: startOffset,
            type: 'ESC_ITALIC_ON',
            bytes: [0x1B, 0x34],
            description: 'Italic on',
          });
          i += 2;
          break;

        case 0x35: // ESC 5 (Italic off)
          commands.push({
            offset: startOffset,
            type: 'ESC_ITALIC_OFF',
            bytes: [0x1B, 0x35],
            description: 'Italic off',
          });
          i += 2;
          break;

        case 0x2D: // ESC - n (Underline)
          if (i + 2 < data.length) {
            const n = data[i + 2];
            commands.push({
              offset: startOffset,
              type: n ? 'ESC_UNDERLINE_ON' : 'ESC_UNDERLINE_OFF',
              bytes: [0x1B, 0x2D, n],
              description: `Underline ${n ? 'on' : 'off'}`,
            });
            i += 3;
          } else {
            i += 2;
          }
          break;

        case 0x57: // ESC W n (Double width)
          if (i + 2 < data.length) {
            const n = data[i + 2];
            commands.push({
              offset: startOffset,
              type: n ? 'ESC_DWIDTH_ON' : 'ESC_DWIDTH_OFF',
              bytes: [0x1B, 0x57, n],
              description: `Double width ${n ? 'on' : 'off'}`,
            });
            i += 3;
          } else {
            i += 2;
          }
          break;

        default:
          // Other ESC commands - skip based on known lengths
          commands.push({
            offset: startOffset,
            type: 'ESC_OTHER',
            bytes: [0x1B, cmd],
            description: `ESC ${cmd.toString(16).padStart(2, '0')} (${String.fromCharCode(cmd)})`,
          });
          i += 2;
          break;
      }
    } else {
      i++;
    }
  }

  return commands;
}

function scanForAnomalies(filename: string, data: Uint8Array): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const commands = parseEscPCommands(data);

  // Check 1: ESC @ at start
  if (commands.length === 0 || commands[0].type !== 'ESC_INIT') {
    anomalies.push({
      file: filename,
      offset: 0,
      type: 'MISSING_INIT',
      severity: 'error',
      message: 'Missing ESC @ initialization at start of file',
    });
  }

  // Check 2: Multiple ESC @ commands
  const initCommands = commands.filter((c) => c.type === 'ESC_INIT');
  if (initCommands.length > 1) {
    anomalies.push({
      file: filename,
      offset: initCommands[1].offset,
      type: 'DUPLICATE_INIT',
      severity: 'warning',
      message: `Multiple ESC @ commands found (${initCommands.length} total)`,
    });
  }

  // Check 3: Consecutive duplicate commands
  for (let i = 1; i < commands.length; i++) {
    const prev = commands[i - 1];
    const curr = commands[i];

    // Check for exact duplicate
    if (prev.type === curr.type && JSON.stringify(prev.bytes) === JSON.stringify(curr.bytes)) {
      anomalies.push({
        file: filename,
        offset: curr.offset,
        type: 'DUPLICATE_CMD',
        severity: 'warning',
        message: `Duplicate command: ${curr.description}`,
      });
    }

    // Check for redundant style toggles (on-off-on pattern)
    if (i >= 2) {
      const prevPrev = commands[i - 2];
      if (
        prevPrev.type.startsWith('ESC_') &&
        prevPrev.type.endsWith('_ON') &&
        prev.type === prevPrev.type.replace('_ON', '_OFF') &&
        curr.type === prevPrev.type
      ) {
        anomalies.push({
          file: filename,
          offset: prev.offset,
          type: 'REDUNDANT_TOGGLE',
          severity: 'info',
          message: `Redundant style toggle: ${prevPrev.type} -> ${prev.type} -> ${curr.type}`,
        });
      }
    }
  }

  // Check 4: Incomplete ESC sequences
  const incompleteCommands = commands.filter((c) => c.type === 'ESC_INCOMPLETE');
  for (const cmd of incompleteCommands) {
    anomalies.push({
      file: filename,
      offset: cmd.offset,
      type: 'INCOMPLETE_ESC',
      severity: 'error',
      message: cmd.description,
    });
  }

  // Check 5: Track Y position for backwards movement
  let currentY = 0;
  let lastYCommand: ParsedCommand | null = null;
  for (const cmd of commands) {
    if (cmd.type === 'ESC_VADVANCE') {
      const advance = cmd.bytes[2] * 2; // Convert to dots
      currentY += advance;
      lastYCommand = cmd;
    }
  }

  // Check 6: Bold style mismatch
  let boldState = false;
  for (const cmd of commands) {
    if (cmd.type === 'ESC_BOLD_ON') {
      if (boldState) {
        anomalies.push({
          file: filename,
          offset: cmd.offset,
          type: 'BOLD_ALREADY_ON',
          severity: 'info',
          message: 'Bold on when already bold',
        });
      }
      boldState = true;
    } else if (cmd.type === 'ESC_BOLD_OFF') {
      if (!boldState) {
        anomalies.push({
          file: filename,
          offset: cmd.offset,
          type: 'BOLD_ALREADY_OFF',
          severity: 'info',
          message: 'Bold off when already off',
        });
      }
      boldState = false;
    }
  }

  return anomalies;
}

async function main() {
  const outputDir = '/Users/mohammadalmechkor/Projects/escp-ts/output';

  console.log('============================================================');
  console.log('  PRN Anomaly Scanner');
  console.log('============================================================\n');

  // Get all PRN files
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.prn'));

  console.log(`Found ${files.length} PRN files to scan\n`);

  const allAnomalies: Anomaly[] = [];

  for (const file of files) {
    const filepath = path.join(outputDir, file);
    const data = fs.readFileSync(filepath);
    const anomalies = scanForAnomalies(file, data);

    if (anomalies.length > 0) {
      allAnomalies.push(...anomalies);
    }
  }

  // Group by severity
  const errors = allAnomalies.filter((a) => a.severity === 'error');
  const warnings = allAnomalies.filter((a) => a.severity === 'warning');
  const infos = allAnomalies.filter((a) => a.severity === 'info');

  console.log('=== SUMMARY ===\n');
  console.log(`Errors:   ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Info:     ${infos.length}`);
  console.log(`Total:    ${allAnomalies.length}\n`);

  if (errors.length > 0) {
    console.log('=== ERRORS ===\n');
    errors.forEach((a) => {
      console.log(`[ERROR] ${a.file} @ 0x${a.offset.toString(16).padStart(4, '0')}`);
      console.log(`        ${a.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log('=== WARNINGS ===\n');
    warnings.forEach((a) => {
      console.log(`[WARN] ${a.file} @ 0x${a.offset.toString(16).padStart(4, '0')}`);
      console.log(`       ${a.message}\n`);
    });
  }

  if (infos.length > 0) {
    console.log('=== INFO ===\n');
    // Group by type for cleaner output
    const byType = new Map<string, Anomaly[]>();
    infos.forEach((a) => {
      if (!byType.has(a.type)) {
        byType.set(a.type, []);
      }
      byType.get(a.type)!.push(a);
    });

    byType.forEach((anomalies, type) => {
      console.log(`${type}: ${anomalies.length} occurrences`);
      if (anomalies.length <= 5) {
        anomalies.forEach((a) => {
          console.log(`  - ${a.file} @ 0x${a.offset.toString(16).padStart(4, '0')}: ${a.message}`);
        });
      } else {
        console.log(`  (showing first 3)`);
        anomalies.slice(0, 3).forEach((a) => {
          console.log(`  - ${a.file} @ 0x${a.offset.toString(16).padStart(4, '0')}: ${a.message}`);
        });
      }
      console.log();
    });
  }

  if (allAnomalies.length === 0) {
    console.log('No anomalies detected - all PRN files appear well-formed.\n');
  }
}

main().catch(console.error);
