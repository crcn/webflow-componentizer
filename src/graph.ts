// @flow
import {parseSource} from './parser';
import {parseCSS} from './parser/css-parser';
import {
  ExpressionType,
  Node,
  Fragment,
  Element,
  BaseNode,
  ParentNode,
  Text,
  StyleElement,
  findElementByTagName,
  isParentNode,
  isElement,
  filterElementsByTagName,
  createFragment,
  prependChild,
} from './parser/ast';

export type GraphDependencyMimeType = 'text/html' | 'text/css';

export type GraphDependency = {
  url: string,
  mimeType: GraphDependencyMimeType,
  dependencies: {
    // relative path : resolved path
    [identifier: string]: string,
  },
  content: string,
};

export type Graph = {
  [identifier: string]: GraphDependency,
};

export const bundleHTMLDocuments = (graph: Graph): Fragment[] => {
  const htmlDocuments = getGraphDependenciesFromMimeType('text/html', graph);
  return htmlDocuments.map(document => bundleHTMLDocument(document, graph));
};

const bundleHTMLDocument = (htmlDocument: GraphDependency, graph: Graph) => {
  const html = parseHTMLGraphDependency(htmlDocument);
  const body = findElementByTagName(html, 'body');

  let document = createFragment(body.children);
  const cssLinks = filterElementsByTagName(html, 'link').filter(link =>
    link.attributes.some(
      attr => attr.key === 'type' && attr.value === 'text/css'
    )
  );
  for (const cssLink of cssLinks) {
    document = prependChild(getCSSStyleFromLink(cssLink, graph), document);
  }

  return document;
};

const getCSSStyleFromLink = (cssLink: Element, graph: Graph): StyleElement => {
  const href = cssLink.attributes.find(attr => attr.key === 'href');
  const dependency = graph[href.value];
  const styleSheet = parseCSS(prepareCSSContentForParser(dependency.content));
  return {
    type: ExpressionType.ELEMENT,
    tagName: 'style',
    children: [],
    attributes: [],
    styleSheet,
  };
};

const getGraphDependenciesFromMimeType = (
  mimeType: GraphDependencyMimeType,
  graph: Graph
) =>
  Object.values(graph).filter(dependency => {
    return dependency.mimeType === mimeType;
  });

const parseHTMLGraphDependency = (dependency: GraphDependency): Element => {
  let ast = parseSource(prepareHTMLContentForParser(dependency.content));
  ast = pruneExtraneousNodes(ast);
  return ast as Element;
};

const pruneExtraneousNodes = (node: Node): Node => {
  let copy = node;
  if (isParentNode(node)) {
    copy = {
      ...copy,
      children: node.children
        .filter(child => !isElement(child) || !/script/.test(child.tagName))
        .map(pruneExtraneousNodes) as any,
    } as ParentNode;
  }
  return copy;
};

/**
 * Tiny util for removing extraneous content
 */

const prepareHTMLContentForParser = (html: string) => {
  // remove comments
  html = html.replace(/<!.*?>/g, '');

  return html;
};

const prepareCSSContentForParser = (css: string) => {
  // remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  return css;
};
