/**
 * Badge component - inline status indicator
 */

import type { BadgeProps, NodeStyle } from '../../types';
import type { LayoutNode, TextNode } from '../../../layout/nodes';
import { Text } from '../content/Text';

const BADGE_STYLES: Record<string, Partial<NodeStyle>> = {
  default: {},
  success: { bold: true },
  warning: { italic: true },
  error: { bold: true, doubleWidth: true },
};

/**
 * Extract text content from children (handles JSX-processed children)
 * When used in JSX, children may be an array of LayoutNodes instead of a string
 */
function extractTextContent(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children
      .map((c) => {
        if (typeof c === 'string' || typeof c === 'number') return String(c);
        if ((c as TextNode)?.type === 'text') return (c as TextNode).content;
        return '';
      })
      .join('');
  }
  // Handle single TextNode
  if ((children as TextNode)?.type === 'text') {
    return (children as TextNode).content;
  }
  return '';
}

export function Badge(props: BadgeProps): LayoutNode {
  const { variant = 'default', style, children } = props;
  const variantStyle = BADGE_STYLES[variant] || {};
  const textContent = extractTextContent(children);

  return Text({
    ...(style && { style: { ...variantStyle, ...style } }),
    ...(!style && Object.keys(variantStyle).length > 0 && { style: variantStyle }),
    children: `[${textContent}]`,
  });
}
