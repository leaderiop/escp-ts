/**
 * Layout component - root container
 */

import { createElement } from '../../createElement';
import type { LayoutProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Layout(props: LayoutProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'Layout',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
