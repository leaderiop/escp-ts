/**
 * Label component - key-value pair display
 */

import type { LabelProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Flex } from '../layout/Flex';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';

export function Label(props: LabelProps): LayoutNode {
  const {
    label,
    value,
    labelWidth = 150,
    colon = true,
    style,
    children,
  } = props;

  const labelText = colon ? `${label}:` : label;

  const valueContent = value !== undefined
    ? Text({ children: String(value) })
    : (Array.isArray(children) ? children[0] : children);

  // Wrap label in a Stack with explicit width to create a fixed-width column
  // This prevents the label from being clipped due to flex row context
  // and ensures proper spacing between label and value
  return Flex({
    ...(style && { style }),
    children: [
      Stack({
        style: { width: labelWidth },
        children: Text({ children: labelText }),
      }),
      valueContent as LayoutNode,
    ],
  });
}
