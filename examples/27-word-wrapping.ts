/**
 * Example 27: Word Wrapping
 *
 * Demonstrates automatic word wrapping for long text:
 * - Using printWrapped() for automatic line breaks
 * - Word wrap respects current font settings
 * - Wrapping with different CPI and font modes
 * - Paragraph formatting
 *
 * Run: npx tsx examples/27-word-wrapping.ts
 */

import { LayoutEngine, PRINT_QUALITY, stack, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Word Wrapping Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  engine.setQuality(PRINT_QUALITY.LQ);

  const layout = stack()
    .gap(15)
    .padding(40)

    // Title
    .text('AUTOMATIC WORD WRAPPING', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('printWrapped() automatically breaks text at word boundaries.')
    .text('Text wraps when it reaches the right margin of the page.')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  // Sample paragraphs
  const shortText = 'This is a short line that may or may not wrap.';
  const mediumText = 'This is a medium-length paragraph that demonstrates how text is wrapped at word boundaries when it exceeds the printable width of the page.';
  const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

  // Basic word wrapping
  engine.newLine();
  engine.setBold(true).println('BASIC WORD WRAPPING').setBold(false);
  engine.println('');

  engine.println('Short text:');
  engine.printWrapped(shortText);
  engine.newLine();

  engine.println('Medium text:');
  engine.printWrapped(mediumText);
  engine.newLine();

  engine.println('Long text (Lorem Ipsum):');
  engine.printWrapped(longText);
  engine.newLine();

  // Wrapping with different CPI
  engine.println('----------------------------------------');
  engine.setBold(true).println('WORD WRAP AT DIFFERENT CPI').setBold(false);
  engine.println('');

  const demoText = 'The quick brown fox jumps over the lazy dog. This sentence is used to demonstrate how different character densities affect word wrapping behavior.';

  engine.println('10 CPI (standard):');
  engine.setCpi(10);
  engine.printWrapped(demoText);
  engine.newLine();

  engine.println('12 CPI (more characters per inch):');
  engine.setCpi(12);
  engine.printWrapped(demoText);
  engine.newLine();

  engine.println('15 CPI (condensed):');
  engine.setCpi(15);
  engine.printWrapped(demoText);
  engine.newLine();

  engine.setCpi(10); // Reset

  // Wrapping with font styles
  engine.println('----------------------------------------');
  engine.setBold(true).println('WORD WRAP WITH FONT STYLES').setBold(false);
  engine.println('');

  const styledText = 'This text demonstrates how word wrapping adjusts for different font styles and widths.';

  engine.println('Normal:');
  engine.printWrapped(styledText);
  engine.newLine();

  engine.println('Bold:');
  engine.setBold(true);
  engine.printWrapped(styledText);
  engine.setBold(false);
  engine.newLine();

  engine.println('Double width (wider characters):');
  engine.setDoubleWidth(true);
  engine.printWrapped(styledText);
  engine.setDoubleWidth(false);
  engine.newLine();

  engine.println('Condensed (narrower characters):');
  engine.setCondensed(true);
  engine.printWrapped(styledText);
  engine.setCondensed(false);
  engine.newLine();

  // Multiple paragraphs
  engine.println('----------------------------------------');
  engine.setBold(true).println('MULTIPLE PARAGRAPHS').setBold(false);
  engine.println('');

  const paragraph1 = 'This is the first paragraph. It contains introductory information about the topic at hand. Notice how each paragraph is separated by blank lines for readability.';
  const paragraph2 = 'The second paragraph continues the discussion. Word wrapping ensures that text flows naturally from one line to the next without breaking words inappropriately.';
  const paragraph3 = 'Finally, the third paragraph concludes our example. Automatic word wrapping is essential for printing documents, reports, and any text that exceeds a single line.';

  engine.printWrapped(paragraph1);
  engine.newLine();
  engine.printWrapped(paragraph2);
  engine.newLine();
  engine.printWrapped(paragraph3);
  engine.newLine();

  // Practical example: Document formatting
  engine.println('----------------------------------------');
  engine.setBold(true).println('PRACTICAL EXAMPLE: MEMO FORMAT').setBold(false);
  engine.println('');

  engine.setBold(true);
  engine.setDoubleWidth(true);
  engine.println('INTERNAL MEMO');
  engine.setDoubleWidth(false);
  engine.setBold(false);
  engine.println('');

  engine.print('TO:      ');
  engine.println('All Department Heads');
  engine.print('FROM:    ');
  engine.println('Office of the President');
  engine.print('DATE:    ');
  engine.println('January 15, 2024');
  engine.print('SUBJECT: ');
  engine.println('Quarterly Review Meeting');
  engine.println('');
  engine.println('----------------------------------------');
  engine.println('');

  const memoBody = 'Please be advised that the quarterly review meeting has been scheduled for next Monday at 9:00 AM in Conference Room A. All department heads are required to attend and present their quarterly reports. The meeting is expected to last approximately three hours, with a short break scheduled at the midpoint. Please come prepared with your performance metrics and projections for the upcoming quarter.';

  engine.printWrapped(memoBody);
  engine.newLine();

  const memoClosing = 'Your cooperation in this matter is greatly appreciated. If you have any questions or conflicts with the scheduled time, please contact my office at your earliest convenience.';

  engine.printWrapped(memoClosing);
  engine.newLine();

  engine.println('----------------------------------------');
  engine.setBold(true).println('NOTE').setBold(false);
  engine.println('printWrapped() respects current font settings.');
  engine.println('Width is calculated based on CPI, double-width, condensed mode, etc.');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Word Wrapping Demo', '27-word-wrapping');
}

main().catch(console.error);
