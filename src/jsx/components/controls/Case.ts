/**
 * Case component - individual case branch for Switch
 */

import { createElement } from '../../createElement';
import type { CaseProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Case(props: CaseProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement(
    'Case',
    rest as Props,
    ...(Array.isArray(children) ? children : children ? [children] : [])
  ) as LayoutNode;
}
