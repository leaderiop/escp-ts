/**
 * Label component - key-value pair display
 */

import type { LabelProps, NodeStyle } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Flex } from '../layout/Flex';
import { Text } from '../content/Text';

export function Label(props: LabelProps): LayoutNode {
  const { label, value, colon = true, typeface, style, children } = props;

  const labelText = colon ? `${label}:` : label;

  const valueContent =
    value !== undefined
      ? Text({ children: String(value) })
      : Array.isArray(children)
        ? children[0]
        : children;

  // Merge styles: style prop < direct typeface prop
  const mergedStyle: NodeStyle | undefined =
    style || typeface !== undefined
      ? { ...style, ...(typeface !== undefined && { typeface }) }
      : undefined;

  // Simple implementation: just render label and value as text in a Flex
  // DEBUG: Using simplest possible layout to isolate truncation issue
  return Flex({
    style: { gap: 18, ...mergedStyle },
    children: [Text({ children: labelText }), valueContent as LayoutNode],
  });
}
