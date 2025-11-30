/**
 * Example 29: Page Headers and Footers
 *
 * Demonstrates how to create documents with:
 * - Consistent page headers
 * - Page numbering in footers
 * - Multi-page document formatting
 * - Using form feeds between pages
 *
 * Run: npx tsx examples/29-page-headers-footers.ts
 */

import { LayoutEngine, PRINT_QUALITY, stack, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

// Helper to print a page header
function printHeader(engine: LayoutEngine, title: string, date: string) {
  engine.setBold(true);
  engine.print(title);
  engine.setBold(false);

  // Right-align the date
  const titleLen = title.length;
  const dateLen = date.length;
  const totalWidth = 80; // Approximate characters per line
  const padding = totalWidth - titleLen - dateLen;
  engine.print(' '.repeat(Math.max(1, padding)));
  engine.println(date);

  engine.println('='.repeat(totalWidth));
  engine.println('');
}

// Helper to print a page footer
function printFooter(engine: LayoutEngine, pageNum: number, totalPages: number, company: string) {
  engine.println('');
  engine.println('-'.repeat(80));

  const footerLeft = company;
  const footerRight = `Page ${pageNum} of ${totalPages}`;
  const padding = 80 - footerLeft.length - footerRight.length;

  engine.print(footerLeft);
  engine.print(' '.repeat(Math.max(1, padding)));
  engine.println(footerRight);
}

async function main() {
  printSection('Page Headers and Footers Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  engine.setQuality(PRINT_QUALITY.LQ);

  const documentTitle = 'ANNUAL REPORT 2024';
  const documentDate = 'January 15, 2024';
  const companyName = 'ACME Corporation';
  const totalPages = 3;

  // ==================== PAGE 1 ====================
  printHeader(engine, documentTitle, documentDate);

  engine.setBold(true);
  engine.setDoubleWidth(true);
  engine.println('Executive Summary');
  engine.setDoubleWidth(false);
  engine.setBold(false);
  engine.println('');

  engine.printWrapped(
    'This annual report presents the key financial metrics, strategic initiatives, ' +
      'and operational highlights for ACME Corporation during fiscal year 2024. ' +
      'The company has achieved significant growth across all business segments, ' +
      'with revenue increasing by 15% year-over-year and profit margins expanding ' +
      'to industry-leading levels.'
  );
  engine.println('');

  engine.printWrapped(
    'Key accomplishments include the successful launch of three new product lines, ' +
      'expansion into two new international markets, and the completion of our ' +
      'digital transformation initiative. Employee satisfaction scores have reached ' +
      'all-time highs, reflecting our commitment to workplace excellence.'
  );
  engine.println('');

  engine.setBold(true).println('Financial Highlights').setBold(false);
  engine.println('');
  engine.println('  Revenue:              $125.4 Million (+15% YoY)');
  engine.println('  Gross Profit:         $48.2 Million (+18% YoY)');
  engine.println('  Operating Income:     $22.1 Million (+21% YoY)');
  engine.println('  Net Income:           $16.8 Million (+24% YoY)');
  engine.println('  Cash Position:        $45.3 Million');
  engine.println('');

  engine.printWrapped(
    'The following pages provide detailed analysis of our performance, ' +
      'strategic roadmap for the coming year, and comprehensive financial statements.'
  );

  // Print footer and form feed
  printFooter(engine, 1, totalPages, companyName);
  engine.formFeed();

  // ==================== PAGE 2 ====================
  printHeader(engine, documentTitle, documentDate);

  engine.setBold(true);
  engine.setDoubleWidth(true);
  engine.println('Business Segments');
  engine.setDoubleWidth(false);
  engine.setBold(false);
  engine.println('');

  engine.setBold(true).println('Consumer Products Division').setBold(false);
  engine.printWrapped(
    'The Consumer Products Division achieved record sales of $52 million, ' +
      'driven by strong demand for our flagship Widget Pro line. Customer ' +
      'satisfaction scores improved to 94%, and product returns decreased ' +
      'by 30% compared to the previous year.'
  );
  engine.println('');

  engine.setBold(true).println('Enterprise Solutions Division').setBold(false);
  engine.printWrapped(
    'Enterprise Solutions contributed $48 million in revenue, with particular ' +
      'strength in the cloud services segment. New customer acquisitions grew ' +
      'by 40%, and customer retention rates remained above 95%.'
  );
  engine.println('');

  engine.setBold(true).println('International Operations').setBold(false);
  engine.printWrapped(
    'International revenue grew to $25.4 million, representing 20% of total ' +
      'company revenue. Successful market entries in Asia-Pacific and Europe ' +
      'exceeded initial projections by 25%.'
  );
  engine.println('');

  engine.setBold(true).println('Quarterly Revenue Breakdown').setBold(false);
  engine.println('');
  engine.println('  Quarter    Revenue      Growth      Notes');
  engine.println('  -------    --------     ------      -----');
  engine.println('  Q1 2024    $28.1M       +12%        Strong start');
  engine.println('  Q2 2024    $30.5M       +14%        New product launch');
  engine.println('  Q3 2024    $32.8M       +16%        International expansion');
  engine.println('  Q4 2024    $34.0M       +18%        Holiday season');
  engine.println('');

  // Print footer and form feed
  printFooter(engine, 2, totalPages, companyName);
  engine.formFeed();

  // ==================== PAGE 3 ====================
  printHeader(engine, documentTitle, documentDate);

  engine.setBold(true);
  engine.setDoubleWidth(true);
  engine.println('Strategic Outlook');
  engine.setDoubleWidth(false);
  engine.setBold(false);
  engine.println('');

  engine.setBold(true).println('2025 Priorities').setBold(false);
  engine.println('');
  engine.println('  1. Product Innovation');
  engine.println('     - Launch Widget Pro 2.0 with AI integration');
  engine.println('     - Develop new enterprise security solutions');
  engine.println('');
  engine.println('  2. Market Expansion');
  engine.println('     - Enter Latin American markets');
  engine.println('     - Strengthen presence in Asia-Pacific');
  engine.println('');
  engine.println('  3. Operational Excellence');
  engine.println('     - Implement lean manufacturing initiatives');
  engine.println('     - Reduce carbon footprint by 25%');
  engine.println('');
  engine.println('  4. Talent Development');
  engine.println('     - Expand technical training programs');
  engine.println('     - Enhance diversity and inclusion efforts');
  engine.println('');

  engine.setBold(true).println('Financial Targets for 2025').setBold(false);
  engine.println('');
  engine.println('  Revenue Target:       $145 Million (+16%)');
  engine.println('  Gross Margin Target:  40% (vs. 38.5% in 2024)');
  engine.println('  R&D Investment:       $12 Million');
  engine.println('');

  engine.println('-'.repeat(40));
  engine.println('');
  engine.setBold(true);
  engine.println('Thank you for your continued support.');
  engine.setBold(false);
  engine.println('');
  engine.setItalic(true);
  engine.println('Board of Directors');
  engine.println('ACME Corporation');
  engine.setItalic(false);

  // Print footer
  printFooter(engine, 3, totalPages, companyName);
  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Page Headers and Footers Demo', '29-page-headers-footers');
}

main().catch(console.error);
