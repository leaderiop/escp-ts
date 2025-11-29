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
import {
  resolveBorderConfig,
  createTopBorderRow,
  createBottomBorderRow,
  createRowSeparator,
  wrapCellsWithVerticalBorders,
  type TableStructure,
} from '../../../borders/TableBorderRenderer';

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
    border,
  } = props;

  // Resolve border configuration
  const borderConfig = resolveBorderConfig(border);

  // Children-based mode (borders not fully supported without column definitions)
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

  // Column-based mode with borders
  // Uses flexGrow to distribute space proportionally after border characters take their fixed space
  if (borderConfig) {
    const { chars } = borderConfig;
    const tableChildren: LayoutNode[] = [];

    // Helper to convert percentage width to flexGrow value
    const getFlexGrow = (width: string | number | undefined): number => {
      if (typeof width === 'string' && width.endsWith('%')) {
        return parseFloat(width.slice(0, -1));
      }
      return 1;
    };

    // Build structure with original widths for border row generation
    const structure: TableStructure = {
      columnWidths: columns.map((col: TableColumn) => col.width || 'auto'),
      columnCount: columns.length,
    };

    // Top border
    tableChildren.push(createTopBorderRow(structure, chars));

    // Header row with vertical borders
    // Use flexBasis: 0 to ensure flexGrow distributes space equally regardless of content width
    if (showHeader) {
      const headerCells = columns.map((col: TableColumn) =>
        Stack({
          style: { flexGrow: getFlexGrow(col.width), flexShrink: 1, flexBasis: 0 },
          children: Text({
            ...(col.align && { align: col.align }),
            style: { bold: true },
            children: col.header,
          }),
        })
      );
      tableChildren.push(wrapCellsWithVerticalBorders(headerCells, chars));
      tableChildren.push(createRowSeparator(structure, chars));
    }

    // Data rows with borders
    // Use flexBasis: 0 to ensure flexGrow distributes space equally regardless of content width
    if (items) {
      // Data-bound mode with For loop
      const rowCells = columns.map((col: TableColumn) =>
        Stack({
          style: { flexGrow: getFlexGrow(col.width), flexShrink: 1, flexBasis: 0 },
          children: Template({
            template: `{{row.${col.key}}}`,
            ...(col.align && { align: col.align }),
          }),
        })
      );
      tableChildren.push(
        For({
          items,
          as: 'row',
          separator: createRowSeparator(structure, chars),
          children: wrapCellsWithVerticalBorders(rowCells, chars),
        })
      );
    } else if (data) {
      // Static data mode
      data.forEach((row: unknown, index: number) => {
        const rowObj = row as Record<string, unknown>;
        const dataCells = columns.map((col: TableColumn) =>
          Stack({
            style: { flexGrow: getFlexGrow(col.width), flexShrink: 1, flexBasis: 0 },
            children: Text({
              ...(col.align && { align: col.align }),
              children: String(rowObj[col.key] ?? ''),
            }),
          })
        );
        tableChildren.push(wrapCellsWithVerticalBorders(dataCells, chars));
        // Add row separator between data rows (not after the last one)
        if (index < data.length - 1) {
          tableChildren.push(createRowSeparator(structure, chars));
        }
      });
    }

    // Bottom border
    tableChildren.push(createBottomBorderRow(structure, chars));

    return Stack({
      ...(style && { style }),
      children: tableChildren,
    });
  }

  // Column-based mode without borders (original behavior)
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
