/**
 * Switch component - multi-branch selection based on data value
 */

import { createElement } from '../../createElement';
import type { SwitchProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Switch(props: SwitchProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'Switch',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
