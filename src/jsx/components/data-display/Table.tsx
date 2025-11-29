/**
 * Table, TableRow, and TableCell components
 */

import type {
  TableProps,
  TableRowProps,
  TableCellProps,
  TableColumn,
} from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Flex } from '../layout/Flex';
import { Text } from '../content/Text';
import { Line } from '../content/Line';
import { For } from '../controls/For';
import { Template } from '../content/Template';

export function TableCell(props: TableCellProps): LayoutNode {
  const { width, align, style, children } = props;

  const cellContent = typeof children === 'string' || typeof children === 'number'
    ? Text({ ...(align && { align }), children })
    : children;

  return Stack({
    style: { width: width || 'auto', ...style },
    children: cellContent,
  });
}

export function TableRow(props: TableRowProps): LayoutNode {
  const { style, children } = props;

  return Flex({
    style: { gap: 10, ...style },
    children,
  });
}

export function Table(props: TableProps): LayoutNode {
  const {
    columns,
    data,
    items,
    showHeader = true,
    headerStyle,
    rowStyle,
    separator = '-',
    style,
    children,
  } = props;

  // Children-based mode
  if (!columns) {
    const tableChildren: LayoutNode[] = [
      Line({ char: separator, length: 'fill' }),
    ];
    if (Array.isArray(children)) {
      tableChildren.push(...(children as LayoutNode[]));
    } else if (children) {
      tableChildren.push(children as LayoutNode);
    }
    tableChildren.push(Line({ char: separator, length: 'fill' }));

    return Stack({
      ...(style && { style }),
      children: tableChildren,
    });
  }

  // Column-based mode
  const tableChildren: LayoutNode[] = [];

  // Header row
  if (showHeader) {
    tableChildren.push(
      Flex({
        style: { gap: 10, ...headerStyle },
        children: columns.map((col: TableColumn) =>
          Stack({
            style: { width: col.width || 'auto' },
            children: Text({
              ...(col.align && { align: col.align }),
              style: { bold: true },
              children: col.header,
            }),
          })
        ),
      })
    );
  }

  tableChildren.push(Line({ char: separator, length: 'fill' }));

  // Data rows
  if (items) {
    tableChildren.push(
      For({
        items,
        as: 'row',
        children: Flex({
          style: { gap: 10, ...rowStyle },
          children: columns.map((col: TableColumn) =>
            Stack({
              style: { width: col.width || 'auto' },
              children: Template({
                template: `{{row.${col.key}}}`,
                ...(col.align && { align: col.align }),
              }),
            })
          ),
        }),
      })
    );
  } else if (data) {
    data.forEach((row: unknown) => {
      const rowObj = row as Record<string, unknown>;
      tableChildren.push(
        Flex({
          style: { gap: 10, ...rowStyle },
          children: columns.map((col: TableColumn) =>
            Stack({
              style: { width: col.width || 'auto' },
              children: Text({
                ...(col.align && { align: col.align }),
                children: String(rowObj[col.key] ?? ''),
              }),
            })
          ),
        })
      );
    });
  }

  tableChildren.push(Line({ char: separator, length: 'fill' }));

  return Stack({
    ...(style && { style }),
    children: tableChildren,
  });
}
