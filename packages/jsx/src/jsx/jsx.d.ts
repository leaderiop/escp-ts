/**
 * JSX Type Declarations for ESC/P2 Layout System
 *
 * This file contains ambient type declarations for JSX support.
 * Declaration files (.d.ts) are the correct place for global type augmentations.
 */

import type { LayoutNode } from '../layout/nodes';
import type {
  LayoutProps,
  StackProps,
  FlexProps,
  TextProps,
  SpacerProps,
  LineProps,
  TemplateProps,
  IfProps,
  SwitchProps,
  CaseProps,
  ForProps,
} from './types';

declare global {
  namespace JSX {
    type Element = LayoutNode;

    interface IntrinsicElements {
      Layout: LayoutProps;
      Stack: StackProps;
      Flex: FlexProps;
      Text: TextProps;
      Spacer: SpacerProps;
      Line: LineProps;
      Template: TemplateProps;
      If: IfProps;
      Switch: SwitchProps;
      Case: CaseProps;
      For: ForProps;
    }

    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}
