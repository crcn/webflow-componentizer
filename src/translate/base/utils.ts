
import { repeat, uniq, camelCase } from "lodash";
import { Element, filterNodes, getAttributeValue, ExpressionType } from "../../parser/ast";
import { Graph } from "../../graph";
import { COMPONENT_ATTRIBUTE_NAME } from "../../constants";

export type TranslateOptions = {
  // compileNonComponents?: boolean;
  // includeCSS?: boolean;
};

export type TranslateContext = {
  // options: TranslateOptions;
  // rootDirectory: string;
  buffer: string;
  newLine?: boolean;
  currentScope?: string;
  entry: Element;
  warnings: Error[];
  definedObjects: {
    // scope id
    [identifier: string]: {
      [identifier: string]: boolean;
    };
  };
  scopedLabelRefs: {
    // scope ID
    [identifier: string]: {
      // var name
      [identifier: string]: string[];
    };
  };
  depth: number;
};

const INDENT = "  ";

export const addBuffer = (buffer: string = "", context: TranslateContext) => ({
  ...context,
  buffer: (context.buffer || "") + buffer
});

export const addLineItem = (buffer: string = "", context: TranslateContext) =>
  addBuffer((context.newLine ? repeat(INDENT, context.depth) : "") + buffer, {
    ...context,
    newLine: buffer.lastIndexOf("\n") === buffer.length - 1
  });

export const addLine = (buffer: string = "", context: TranslateContext) =>
  addLineItem(buffer + "\n", context);

export const addOpenTag = (
  buffer: string,
  context: TranslateContext,
  indent: boolean = true
) => ({
  ...addLineItem(buffer, context),
  depth: indent ? context.depth + 1 : context.depth
});

export const addCloseTag = (
  buffer: string,
  context: TranslateContext,
  indent: boolean = true
) =>
  addLineItem(buffer, {
    ...context,
    depth: indent ? context.depth - 1 : context.depth
  });

export const setCurrentScope = (
  currentScope: string,
  context: TranslateContext
) => ({
  ...context,
  currentScope
});

export const addScopedLayerLabel = (
  label: string,
  id: string,
  context: TranslateContext
) => {
  label = String(label).toLowerCase();
  if (context.scopedLabelRefs[id]) {
    return context;
  }

  const scope = context.currentScope;

  if (!context.scopedLabelRefs[scope]) {
    context = {
      ...context,
      scopedLabelRefs: {
        ...context.scopedLabelRefs,
        [context.currentScope]: {}
      }
    };
  }

  return {
    ...context,
    scopedLabelRefs: {
      ...context.scopedLabelRefs,
      [scope]: {
        ...context.scopedLabelRefs[scope],
        [label]: uniq([
          ...(context.scopedLabelRefs[scope][label] || []),
          id
        ])
      }
    }
  };
};

// export const getInternalVarName = (node: Nod) => "_" + node.id;

export const getScopedLayerLabelIndex = (
  label: string,
  id: string,
  context: TranslateContext
) => {
  return context.scopedLabelRefs[context.currentScope][
    String(label).toLowerCase()
  ].indexOf(id);
};
export const getPublicLayerVarName = (
  label: string,
  id: string,
  context: TranslateContext
) => {
  const i = getScopedLayerLabelIndex(label, id, context);
  return makeSafeVarName(camelCase(label || "child") + (i === 0 ? "" : i));
};

export const makeSafeVarName = (varName: string) => {
  if (/^\d/.test(varName)) {
    varName = "$" + varName;
  }
  return varName;
};

export const addWarning = (warning: Error, context: TranslateContext) => ({
  ...context,
  warnings: [...context.warnings, warning]
});

export const getComponentElements = (ast: Element) => filterNodes(ast, child => {
  return child.type === ExpressionType.ELEMENT && Boolean(getAttributeValue(COMPONENT_ATTRIBUTE_NAME, child));
}) as Element[];