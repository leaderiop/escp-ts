/**
 * Stack component - vertical or horizontal container
 */

import { createElement } from '../../createElement';
import type { StackProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Stack(props: StackProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'Stack',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
