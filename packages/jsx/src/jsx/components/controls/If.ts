/**
 * If component - conditional rendering based on data condition
 */

import { createElement } from '../../createElement';
import type { IfProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function If(props: IfProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'If',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
