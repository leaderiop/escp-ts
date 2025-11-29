/**
 * Text component - text content
 */

import { createElement } from '../../createElement';
import type { TextProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Text(props: TextProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'Text',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
