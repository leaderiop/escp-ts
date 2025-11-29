/**
 * List and ListItem components - ordered and unordered lists
 */

import type { ListProps, ListItemProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Flex } from '../layout/Flex';
import { Text } from '../content/Text';
import { For } from '../controls/For';
import { Template } from '../content/Template';

export function ListItem(props: ListItemProps): LayoutNode {
  const { bullet, style, children } = props;

  if (bullet !== undefined) {
    const itemChildren: LayoutNode[] = [Text({ style: { width: 20 }, children: bullet })];
    if (Array.isArray(children)) {
      itemChildren.push(...(children as LayoutNode[]));
    } else if (children) {
      itemChildren.push(children as LayoutNode);
    }
    return Flex({
      ...(style && { style }),
      children: itemChildren,
    });
  }

  if (Array.isArray(children)) {
    return Stack({ ...(style && { style }), children: children as LayoutNode[] });
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return Text({ ...(style && { style }), children });
  }
  return children as LayoutNode;
}

export function List(props: ListProps): LayoutNode {
  const {
    items,
    as = 'item',
    variant = 'bullet',
    bullet = '*',
    indent: customIndent,
    style,
    children,
  } = props;

  // Calculate appropriate default indent based on variant
  // At 10 CPI: 1 char = 36 dots
  // - Bullet (*/-): 1 char = 36 dots, use 40 (with 4 dot gap)
  // - Numbered (1./2./...): 2-3 chars, use 80 dots (for up to "99." with some gap)
  const defaultIndent = variant === 'numbered' ? 80 : 40;
  const indent = customIndent ?? defaultIndent;

  // Data-bound mode using For
  if (items) {
    return Stack({
      style: { gap: 3, ...style },
      children: For({
        items,
        as,
        indexAs: '_listIndex',
        children: Flex({
          children: [
            variant === 'numbered'
              ? Stack({
                  style: { width: indent },
                  children: Template({ template: '{{_listIndex}}.' }),
                })
              : Text({
                  style: { width: indent },
                  children: variant === 'bullet' ? bullet : '',
                }),
            Template({ template: `{{${as}}}` }),
          ],
        }),
      }),
    });
  }

  // Manual children mode
  const childArray = Array.isArray(children) ? children : children ? [children] : [];

  let index = 0;
  const listItems = childArray.map((child) => {
    index++;
    const bulletText = variant === 'numbered' ? `${index}.` : variant === 'bullet' ? bullet : '';

    return Flex({
      children: [Text({ style: { width: indent }, children: bulletText }), child as LayoutNode],
    });
  });

  return Stack({
    style: { gap: 3, ...style },
    children: listItems,
  });
}
