/**
 * Run all QA tests
 *
 * Usage: pnpm qa:all
 */

import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { qaTests } from '../index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

interface Result {
  id: string;
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function runQaTest(test: (typeof qaTests)[0]): Promise<Result> {
  const start = Date.now();
  const filePath = path.resolve(rootDir, 'src', test.path);

  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsx', filePath], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stderr = '';
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        id: test.id,
        name: test.name,
        success: code === 0,
        duration: Date.now() - start,
        error: code !== 0 ? stderr.slice(0, 200) : undefined,
      });
    });

    proc.on('error', (err) => {
      resolve({
        id: test.id,
        name: test.name,
        success: false,
        duration: Date.now() - start,
        error: err.message,
      });
    });
  });
}

async function main() {
  console.log('Running all QA tests...\n');
  console.log('='.repeat(60));

  const results: Result[] = [];

  for (const test of qaTests) {
    process.stdout.write(`[${test.id}] ${test.name}... `);
    const result = await runQaTest(test);
    results.push(result);

    if (result.success) {
      console.log(`OK (${result.duration}ms)`);
    } else {
      console.log(`FAILED (${result.duration}ms)`);
      if (result.error) {
        console.log(`    Error: ${result.error.split('\n')[0]}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - [${r.id}] ${r.name}`);
      });
    process.exit(1);
  }
}

main().catch(console.error);
