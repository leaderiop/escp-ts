/**
 * Section component - semantic section with optional heading
 */

import type { SectionProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Heading } from '../typography/Heading';

export function Section(props: SectionProps): LayoutNode {
  const { title, level = 2, style, children } = props;

  const sectionChildren: LayoutNode[] = [];
  if (title) {
    sectionChildren.push(Heading({ level, children: title }));
  }
  if (Array.isArray(children)) {
    sectionChildren.push(...(children as LayoutNode[]));
  } else if (children) {
    sectionChildren.push(children as LayoutNode);
  }

  return Stack({
    style: { margin: { top: 15, bottom: 15 }, ...style },
    children: sectionChildren,
  });
}
