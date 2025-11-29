/**
 * Label component - key-value pair display
 */

import type { LabelProps, NodeStyle } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Flex } from '../layout/Flex';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';

export function Label(props: LabelProps): LayoutNode {
  const {
    label,
    value,
    labelWidth = 250, // Default width: ~7 characters at 10 CPI (36 dots/char)
    colon = true,
    typeface,
    style,
    children,
  } = props;

  const labelText = colon ? `${label}:` : label;

  const valueContent = value !== undefined
    ? Text({ children: String(value) })
    : (Array.isArray(children) ? children[0] : children);

  // Merge styles: style prop < direct typeface prop
  const mergedStyle: NodeStyle | undefined = (style || typeface !== undefined)
    ? { ...style, ...(typeface !== undefined && { typeface }) }
    : undefined;

  // Wrap label in a Stack with explicit width to create a fixed-width column
  // This prevents the label from being clipped due to flex row context
  // and ensures proper spacing between label and value
  return Flex({
    style: { gap: 18, ...mergedStyle }, // 18 dots = ~0.5 char at 10 CPI for spacing after colon
    children: [
      Stack({
        style: { width: labelWidth },
        children: Text({ children: labelText }),
      }),
      valueContent as LayoutNode,
    ],
  });
}
