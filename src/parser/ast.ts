import {BaseExpression} from './base-ast';
import {CSSExpressionType, StyleSheet, Rule} from './css-ast';

/**
 * AST for the designer. Vanilla HTML for now, but may evolve depending
 * on designers features (E-commerce, CMS, IX2)
 */

export enum ExpressionType {
  ELEMENT = 'element',
  TEXT = 'text',
  ATTRIBUTE = 'attribute',
  FRAGMENT = 'fragment',
};


export type BaseNode<TType> = {} & BaseExpression<TType>;

export type Attribute = {
  key: string,
  value?: string,
} & BaseExpression<ExpressionType.ATTRIBUTE>;

export type BaseParentNode<TType> = {
  children: BaseNode<any>[],
} & BaseNode<TType>;

export type Element = {
  attributes: Attribute[],
  tagName: string,
} & BaseParentNode<ExpressionType.ELEMENT>;

export type Fragment = {} & BaseParentNode<ExpressionType.FRAGMENT>;

export type StyleElement = {
  styleSheet: StyleSheet,
} & Element;

export type HTMLStyle = {
  [identifier: string]: string,
};

export type Text = {
  value: string,
} & BaseNode<ExpressionType.TEXT>;

export type Node = Element | Text | Fragment;
export type ParentNode = Element | Fragment;
export type Expression = Node | Attribute;

export type FindNodeFilter = (current: Node) => boolean;

export const isElement = (node: BaseNode<any>): node is Element =>
  node.type === ExpressionType.ELEMENT;
export const isParentNode = (node: Node): node is ParentNode =>
  node.type === ExpressionType.FRAGMENT || isElement(node);

export const findNode = (node: Node, filter: FindNodeFilter) => {
  let found;
  traverseNodes(node, current => {
    if (filter(current)) {
      found = current;
      return false;
    }
  });
  return found;
};

export const filterNodes = (node: Node, filter: FindNodeFilter) => {
  const found = [];
  traverseNodes(node, current => {
    if (filter(current)) {
      found.push(current);
    }
  });
  return found;
};

export const traverseNodes = (current: Node, each: (node: Node) => void | boolean) => {
  if (each(current) === false) {
    return false;
  }
  if (isParentNode(current)) {
    for (const child of current.children) {
      if (traverseNodes(child as any, each) === false) {
        break;
      }
    }
  }
};

export const findElementByTagName = (current: Node, tagName: string): Element =>
  findNode(
    current,
    node => node.type === ExpressionType.ELEMENT && node.tagName === tagName
  );

export const filterElementsByTagName = (
  current: Node,
  tagName: string
): Element[] =>
  filterNodes(
    current,
    node => node.type === ExpressionType.ELEMENT && node.tagName === tagName
  );

export const createFragment = (children: BaseNode<any>[]): Fragment => ({
  type: ExpressionType.FRAGMENT,
  children,
});

export const appendChild = (child: Node, parent: ParentNode) => ({
  ...parent,
  children: [...parent.children, child],
});

export const prependChild = <TParent extends ParentNode>(child: Node, parent: TParent) => ({
  ...(parent as any),
  children: [child, ...parent.children],
});

// TODO - need to also consider media queries
export const getMatchingStyleRules = (element: Element, root: Node) => {
  const styles: StyleElement[] = filterElementsByTagName(root, 'style') as StyleElement[];

  const matchingRules = [];

  for (const style of styles) {
    for (const rule of style.styleSheet.rules) {
      if (styleRuleMatchesElement(rule, element)) {
        matchingRules.push(rule);
      }
    }
  }

  return matchingRules;
};

export const styleRuleMatchesElement = (rule: Rule, element: Element) => {
  if (rule.type !== CSSExpressionType.STYLE_RULE) {
    return false;
  }

  const selector = rule.selector;

  // TODO - keep things simple for now until more complex cases are required.
  const className = getAttributeValue('class', element);
  return className && selector.indexOf(`.${className}`) !== -1;
};

export const getAttribute = (name: string, element: Element) =>
  element.attributes.find(attr => attr.key === name);
export const getAttributeValue = (name: string, element: Element) => {
  const attr = getAttribute(name, element);
  return attr && attr.value;
};
