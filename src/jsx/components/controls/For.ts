/**
 * For component - iteration over array data
 */

import { createElement } from '../../createElement';
import type { ForProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function For(props: ForProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'For',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
