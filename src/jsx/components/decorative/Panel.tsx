/**
 * Panel component - titled panel with header area
 */

import type { PanelProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Flex } from '../layout/Flex';
import { Spacer } from '../layout/Spacer';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

export function Panel(props: PanelProps): LayoutNode {
  const { title, headerActions, style, children } = props;

  const headerChildren: LayoutNode[] = [];
  if (title) {
    headerChildren.push(Text({ style: { bold: true }, children: title }));
  }
  if (headerActions) {
    headerChildren.push(Spacer({ flex: true }));
    if (Array.isArray(headerActions)) {
      headerChildren.push(...(headerActions as LayoutNode[]));
    } else {
      headerChildren.push(headerActions as LayoutNode);
    }
  }

  const panelChildren: LayoutNode[] = [];
  if (headerChildren.length > 0) {
    panelChildren.push(Flex({ children: headerChildren }));
  }
  panelChildren.push(Line({ char: '-', length: 'fill' }));
  panelChildren.push(Stack({ style: { padding: { top: 5, bottom: 5 } }, children }));

  return Stack({
    ...(style && { style }),
    children: panelChildren,
  });
}
