/**
 * Flex component - horizontal flexbox container
 */

import { createElement } from '../../createElement';
import type { FlexProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Flex(props: FlexProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'Flex',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
