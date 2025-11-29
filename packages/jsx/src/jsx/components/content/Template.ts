/**
 * Template component - text with {{variable}} interpolation
 */

import { createElement } from '../../createElement';
import type { TemplateProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Template(props: TemplateProps): LayoutNode {
  return createElement('Template', props as unknown as Props) as LayoutNode;
}
