/**
 * QA Test: Card Border Alignment
 *
 * Minimal reproduction case for card border alignment issues.
 * Tests that border corners align properly with horizontal and vertical lines.
 *
 * Run: pnpm --filter @escp/examples exec tsx src/qa/card-border-alignment.tsx
 */

import { CardDescription, CardFooter, CPI, LayoutEngine, Line, TYPEFACE } from '@escp/jsx';
import { Layout, Stack, Text, Card, CardHeader, CardTitle, CardContent } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

async function main() {
  printSection('Card Border Alignment Test');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  // Minimal card with simple content to test border alignment
  const layout = (
    <Layout style={{ padding: 20 }}>
      <Stack style={{ gap: 20 }}>
        {/* Test 1: Simple card with minimal content */}

        <Text
          style={{
            bold: true,
            typeface: TYPEFACE.ROMAN,
            cpi: CPI.PICA,
            italic: true,
            underline: true,
          }}
        >
          Test 1: Simple Card
        </Text>
        <Card border="single">
          <CardContent>
            <Text>Simple content line 1</Text>
            <Text>Simple content line 2</Text>
          </CardContent>
        </Card>

        {/* Test 2: Card with header */}
        <Text style={{ bold: true }}>Test 2: Card with Header</Text>
        <Card border="single">
          <CardHeader style={{ padding: 40 }}>
            <CardTitle align="center">Test Title</CardTitle>
            <CardDescription>Hello World</CardDescription>
          </CardHeader>
          <Line char="-" style={{ width: 'fill' }} />
          <CardContent style={{ margin: 40 }}>
            <Text>Content under header</Text>
          </CardContent>
          <CardFooter>
            <Text>Card Footer</Text>
          </CardFooter>
        </Card>

        {/* Test 3: Double border */}
        <Text style={{ bold: true }}>Test 3: Double Border</Text>
        <Card border="double">
          <CardContent>
            <Text>Double border content</Text>
          </CardContent>
        </Card>

        {/* Test 4: Fixed width card */}
        <Text style={{ bold: true }}>Test 4: Fixed Width (300)</Text>
        <Stack style={{ width: 300 }}>
          <Card border="single">
            <CardContent>
              <Text>Fixed width card</Text>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Layout>
  );

  engine.render(layout);
  const commands = engine.getOutput();

  await renderPreview(commands, 'Card Border Alignment', 'qa-card-border-alignment', {
    height: 40,
  });
}

main().catch(console.error);
