/**
 * Example 31: Data-Driven Conditional Rendering (JSX Version)
 *
 * Demonstrates conditional rendering based on data values using JSX:
 * - <If condition={...}> for binary conditions
 * - <Switch path="..."><Case value="..."> for switch-case style
 * - Comparison operators: eq, neq, gt, gte, lt, lte, exists, empty
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/31-data-conditionals.tsx
 */

import { LayoutEngine, eq, gt, exists, empty } from '../src/index';
import { Stack, Flex, Text, Line, Spacer, Template, If, Switch, Case } from '../src/jsx';
import type { LayoutNode, DataContext } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Data-Driven Conditional Rendering Demo (JSX)');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Set up sample data with various user scenarios
  engine.setData({
    user: {
      name: 'Alice Johnson',
      membershipTier: 'gold',
      loyaltyPoints: 15000,
      isPremium: true,
      accountStatus: 'active',
      verifiedEmail: true,
    },
    order: {
      status: 'shipped',
      total: 250.0,
      itemCount: 5,
      hasDiscount: true,
      discountPercent: 15,
      shippingMethod: 'express',
      notes: '',
    },
    notification: {
      type: 'promotion',
      urgency: 'low',
    },
  });

  const layout = (
    <Stack style={{ gap: 10, padding: 30 }}>
      {/* Header */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">DATA-DRIVEN CONDITIONALS DEMO</Text>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 15 }} />

      {/* Basic If/Else */}
      <Text style={{ bold: true, underline: true }}>1. BASIC IF/ELSE CONDITIONS</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Using <If condition={...}> with else prop'}</Text>
      <Spacer style={{ height: 8 }} />

      {/* Premium member check */}
      <If
        condition={{ path: 'user.isPremium', operator: 'eq', value: true }}
        else={<Text>Standard Member</Text> as LayoutNode}
      >
        <Flex>
          <Text style={{ bold: true }}>***</Text>
          <Text style={{ bold: true, doubleWidth: true }}> PREMIUM MEMBER </Text>
          <Text style={{ bold: true }}>***</Text>
        </Flex>
      </If>
      <Spacer style={{ height: 5 }} />

      {/* Account status check */}
      <If
        condition={{ path: 'user.accountStatus', operator: 'eq', value: 'active' }}
        else={<Text style={{ italic: true }}>Account Status: INACTIVE</Text> as LayoutNode}
      >
        <Text style={{ bold: true }}>Account Status: ACTIVE</Text>
      </If>
      <Spacer style={{ height: 15 }} />

      {/* Callback Conditions */}
      <Text style={{ bold: true, underline: true }}>2. CALLBACK-BASED CONDITIONS</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Using <If condition={(ctx) => ...}>'}</Text>
      <Spacer style={{ height: 8 }} />

      <If
        condition={(ctx: DataContext) => {
          const data = ctx.data as { user: { loyaltyPoints: number } };
          return data.user.loyaltyPoints >= 10000;
        }}
        else={<Text>Earn more points to become VIP</Text> as LayoutNode}
      >
        <Stack>
          <Text style={{ bold: true }}>VIP Status Achieved!</Text>
          <Template template="You have {{user.loyaltyPoints | number}} points" />
        </Stack>
      </If>
      <Spacer style={{ height: 15 }} />

      {/* Switch Statements */}
      <Text style={{ bold: true, underline: true }}>3. SWITCH-CASE SELECTION</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>{'Using <Switch path="..."><Case value="...">...</Case></Switch>'}</Text>
      <Spacer style={{ height: 8 }} />

      {/* Order status */}
      <Switch
        path="order.status"
        default={<Text>[?] Unknown Status</Text> as LayoutNode}
      >
        <Case value="pending">
          <Text>[CLOCK] Order Pending - Awaiting processing</Text>
        </Case>
        <Case value="processing">
          <Text>[GEAR] Order Processing - Being prepared</Text>
        </Case>
        <Case value="shipped">
          <Text style={{ bold: true }}>[TRUCK] Order Shipped - On the way!</Text>
        </Case>
        <Case value="delivered">
          <Text style={{ bold: true }}>[CHECK] Order Delivered - Complete!</Text>
        </Case>
      </Switch>
      <Spacer style={{ height: 10 }} />

      {/* Notification type */}
      <Switch path="notification.type" default={<Text>Notification</Text> as LayoutNode}>
        <Case value="alert">
          <Text style={{ bold: true, doubleWidth: true }}>ALERT: Important notification!</Text>
        </Case>
        <Case value="warning">
          <Text style={{ bold: true }}>WARNING: Please review</Text>
        </Case>
        <Case value="promotion">
          <Text style={{ italic: true }}>PROMO: Special offer available!</Text>
        </Case>
        <Case value="info">
          <Text>INFO: For your information</Text>
        </Case>
      </Switch>
      <Spacer style={{ height: 15 }} />

      {/* Comparison Operators */}
      <Text style={{ bold: true, underline: true }}>4. COMPARISON OPERATORS</Text>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>eq, neq, gt, gte, lt, lte, exists, empty</Text>
      <Spacer style={{ height: 8 }} />

      {/* Greater than check */}
      <If
        condition={gt('order.total', 200)}
        else={<Template template={'Add {{order.total | currency:"$"}} more for free shipping'} /> as LayoutNode}
      >
        <Text style={{ bold: true }}>Order qualifies for FREE SHIPPING!</Text>
      </If>
      <Spacer style={{ height: 5 }} />

      {/* Exists check */}
      <If
        condition={exists('user.verifiedEmail')}
        else={<Text>Email: Please verify your email</Text> as LayoutNode}
      >
        <Text style={{ bold: true }}>Email: Verified</Text>
      </If>
      <Spacer style={{ height: 5 }} />

      {/* Empty check */}
      <If
        condition={empty('order.notes')}
        else={<Template template="Notes: {{order.notes}}" /> as LayoutNode}
      >
        <Text style={{ italic: true }}>Notes: None provided</Text>
      </If>
      <Spacer style={{ height: 15 }} />

      {/* Membership tier using Switch */}
      <Text style={{ bold: true, underline: true }}>5. MEMBERSHIP TIER DISPLAY</Text>
      <Spacer style={{ height: 8 }} />
      <Switch path="user.membershipTier" default={<Text>Tier: Bronze - Welcome!</Text> as LayoutNode}>
        <Case value="platinum">
          <Flex>
            <Text>Tier: </Text>
            <Text style={{ bold: true, doubleWidth: true }}>PLATINUM</Text>
            <Text> (Top 1%)</Text>
          </Flex>
        </Case>
        <Case value="gold">
          <Text style={{ bold: true }}>Tier: GOLD - Excellent status!</Text>
        </Case>
        <Case value="silver">
          <Text>Tier: Silver - Good standing</Text>
        </Case>
      </Switch>
      <Spacer style={{ height: 15 }} />

      {/* Practical Example */}
      <Text style={{ bold: true, underline: true }}>6. PRACTICAL EXAMPLE: Order Summary</Text>
      <Spacer style={{ height: 5 }} />
      <Line char="-" length="fill" />
      <Spacer style={{ height: 5 }} />

      {/* Customer greeting based on tier */}
      <Switch path="user.membershipTier" default={<Template template="Welcome, {{user.name}}!" /> as LayoutNode}>
        <Case value="platinum">
          <Template template="Welcome back, {{user.name}}! (Platinum VIP)" style={{ bold: true }} />
        </Case>
        <Case value="gold">
          <Template template="Hello, {{user.name}}! (Gold Member)" style={{ bold: true }} />
        </Case>
        <Case value="silver">
          <Template template="Hi, {{user.name}}! (Silver Member)" />
        </Case>
      </Switch>
      <Spacer style={{ height: 10 }} />

      {/* Order details */}
      <Flex>
        <Text>Order Total:</Text>
        <Spacer />
        <Template template={'{{order.total | currency:"$"}}'} style={{ bold: true }} />
      </Flex>
      <Flex>
        <Text>Items:</Text>
        <Spacer />
        <Template template="{{order.itemCount}}" />
      </Flex>

      {/* Shipping method */}
      <If
        condition={{ path: 'order.shippingMethod', operator: 'eq', value: 'express' }}
        else={
          <Flex>
            <Text>Shipping:</Text>
            <Spacer />
            <Text>Standard (5-7 days)</Text>
          </Flex> as LayoutNode
        }
      >
        <Flex>
          <Text>Shipping:</Text>
          <Spacer />
          <Text style={{ bold: true }}>EXPRESS (1-2 days)</Text>
        </Flex>
      </If>
      <Spacer style={{ height: 5 }} />
      <Line char="-" length="fill" />
      <Spacer style={{ height: 15 }} />

      {/* Footer */}
      <Line char="=" length="fill" />
      <Text style={{ italic: true }} align="center">End of Data-Driven Conditionals Demo</Text>
    </Stack>
  ) as LayoutNode;

  engine.render(layout);

  const commands = engine.getOutput();
  await renderPreview(commands, 'Data-Driven Conditionals (JSX)', '31-data-conditionals-jsx');
}

main().catch(console.error);
