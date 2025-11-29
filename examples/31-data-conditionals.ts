/**
 * Example 31: Data-Driven Conditional Rendering
 *
 * Demonstrates conditional rendering based on data values:
 * - conditional().if().then().else() for binary conditions
 * - conditional().ifPath() for declarative path-based conditions
 * - conditional().elseIf() for multi-branch conditions
 * - switchOn() for switch-case style selection
 * - Comparison operators: eq, neq, gt, gte, lt, lte, in, exists, empty
 *
 * Run: npx tsx examples/31-data-conditionals.ts
 */

import {
  LayoutEngine,
  stack,
  flex,
  text,
  template,
  conditional,
  switchOn,
  line,
  eq,
  gt,
  exists,
  empty,
} from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Data-Driven Conditional Rendering Demo');

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

  const layout = stack()
    .gap(10)
    .padding(30)

    // === HEADER ===
    .text('DATA-DRIVEN CONDITIONALS DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // === BASIC IF/ELSE ===
    .text('1. BASIC IF/ELSE CONDITIONS', { bold: true, underline: true })
    .spacer(5)
    .text('Using conditional().ifPath().then().else()', { italic: true })
    .spacer(8)

    // Premium member check
    .add(
      conditional()
        .ifPath('user.isPremium', 'eq', true)
        .then(
          flex()
            .text('***', { bold: true })
            .text(' PREMIUM MEMBER ', { bold: true, doubleWidth: true })
            .text('***', { bold: true })
        )
        .else(text('Standard Member'))
        .build()
    )
    .spacer(5)

    // Account status check
    .add(
      conditional()
        .ifPath('user.accountStatus', 'eq', 'active')
        .then(text('Account Status: ACTIVE', { bold: true }))
        .else(text('Account Status: INACTIVE', { italic: true }))
        .build()
    )
    .spacer(15)

    // === CALLBACK CONDITIONS ===
    .text('2. CALLBACK-BASED CONDITIONS', { bold: true, underline: true })
    .spacer(5)
    .text('Using conditional().if(ctx => ...).then().else()', { italic: true })
    .spacer(8)

    // Loyalty points threshold
    .add(
      conditional()
        .if((ctx) => {
          const data = ctx.data as { user: { loyaltyPoints: number } };
          return data.user.loyaltyPoints >= 10000;
        })
        .then(
          stack()
            .text('VIP Status Achieved!', { bold: true })
            .add(template('You have {{user.loyaltyPoints | number}} points').build())
        )
        .else(text('Earn more points to become VIP'))
        .build()
    )
    .spacer(15)

    // === ELSE-IF CHAINS ===
    .text('3. MULTI-BRANCH CONDITIONS (ELSE-IF)', { bold: true, underline: true })
    .spacer(5)
    .text('Using conditional().if().then().elseIf().else()', { italic: true })
    .spacer(8)

    // Membership tier display
    .add(
      conditional()
        .ifPath('user.membershipTier', 'eq', 'platinum')
        .then(
          flex()
            .text('Tier: ')
            .text('PLATINUM', { bold: true, doubleWidth: true })
            .text(' (Top 1%)')
        )
        .elseIf(eq('user.membershipTier', 'gold'), text('Tier: GOLD - Excellent status!', { bold: true }))
        .elseIf(eq('user.membershipTier', 'silver'), text('Tier: Silver - Good standing'))
        .else(text('Tier: Bronze - Welcome!'))
        .build()
    )
    .spacer(15)

    // === SWITCH STATEMENTS ===
    .text('4. SWITCH-CASE SELECTION', { bold: true, underline: true })
    .spacer(5)
    .text('Using switchOn(path).case(value).case(value).default()', { italic: true })
    .spacer(8)

    // Order status with icons
    .add(
      switchOn('order.status')
        .case('pending', text('[CLOCK] Order Pending - Awaiting processing'))
        .case('processing', text('[GEAR] Order Processing - Being prepared'))
        .case('shipped', text('[TRUCK] Order Shipped - On the way!', { bold: true }))
        .case('delivered', text('[CHECK] Order Delivered - Complete!', { bold: true }))
        .case(['cancelled', 'refunded'], text('[X] Order Cancelled/Refunded', { italic: true }))
        .default(text('[?] Unknown Status'))
        .build()
    )
    .spacer(10)

    // Notification type
    .add(
      switchOn('notification.type')
        .case('alert', text('ALERT: Important notification!', { bold: true, doubleWidth: true }))
        .case('warning', text('WARNING: Please review', { bold: true }))
        .case('promotion', text('PROMO: Special offer available!', { italic: true }))
        .case('info', text('INFO: For your information'))
        .default(text('Notification'))
        .build()
    )
    .spacer(15)

    // === COMPARISON OPERATORS ===
    .text('5. COMPARISON OPERATORS', { bold: true, underline: true })
    .spacer(5)
    .text('eq, neq, gt, gte, lt, lte, in, exists, empty', { italic: true })
    .spacer(8)

    // Greater than check
    .add(
      conditional()
        .if(gt('order.total', 200))
        .then(text('Order qualifies for FREE SHIPPING!', { bold: true }))
        .else(template('Add {{order.total | currency:"$"}} more for free shipping').build())
        .build()
    )
    .spacer(5)

    // Exists check
    .add(
      conditional()
        .if(exists('user.verifiedEmail'))
        .then(text('Email: Verified', { bold: true }))
        .else(text('Email: Please verify your email'))
        .build()
    )
    .spacer(5)

    // Empty check
    .add(
      conditional()
        .if(empty('order.notes'))
        .then(text('Notes: None provided', { italic: true }))
        .else(template('Notes: {{order.notes}}').build())
        .build()
    )
    .spacer(15)

    // === NESTED CONDITIONALS ===
    .text('6. NESTED CONDITIONALS', { bold: true, underline: true })
    .spacer(5)
    .text('Conditionals can contain other conditionals', { italic: true })
    .spacer(8)

    .add(
      conditional()
        .ifPath('order.hasDiscount', 'eq', true)
        .then(
          stack()
            .text('Discount Applied!', { bold: true })
            .add(
              conditional()
                .if(gt('order.discountPercent', 10))
                .then(template('You saved {{order.discountPercent}}% - GREAT DEAL!').bold().build())
                .else(template('You saved {{order.discountPercent}}%').build())
                .build()
            )
        )
        .else(text('No discount on this order'))
        .build()
    )
    .spacer(15)

    // === PRACTICAL EXAMPLE ===
    .text('7. PRACTICAL EXAMPLE: Order Summary', { bold: true, underline: true })
    .spacer(5)
    .line('-', 'fill')
    .spacer(5)

    // Customer greeting based on tier
    .add(
      switchOn('user.membershipTier')
        .case('platinum', template('Welcome back, {{user.name}}! (Platinum VIP)').bold().build())
        .case('gold', template('Hello, {{user.name}}! (Gold Member)').bold().build())
        .case('silver', template('Hi, {{user.name}}! (Silver Member)').build())
        .default(template('Welcome, {{user.name}}!').build())
        .build()
    )
    .spacer(10)

    // Order details with conditional shipping
    .add(
      flex()
        .text('Order Total:')
        .spacer()
        .add(template('{{order.total | currency:"$"}}').bold().build())
    )
    .add(
      flex()
        .text('Items:')
        .spacer()
        .add(template('{{order.itemCount}}').build())
    )
    .add(
      conditional()
        .ifPath('order.shippingMethod', 'eq', 'express')
        .then(
          flex()
            .text('Shipping:')
            .spacer()
            .text('EXPRESS (1-2 days)', { bold: true })
        )
        .else(
          flex()
            .text('Shipping:')
            .spacer()
            .text('Standard (5-7 days)')
        )
        .build()
    )
    .spacer(5)
    .line('-', 'fill')
    .spacer(15)

    // === FOOTER ===
    .line('=', 'fill')
    .text('End of Data-Driven Conditionals Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);

  const commands = engine.getOutput();
  await renderPreview(commands, 'Data-Driven Conditionals', '31-data-conditionals');
}

main().catch(console.error);
