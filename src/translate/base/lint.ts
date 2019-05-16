import { TranslateContext, getComponentElements, addWarning } from "./utils";
import { Element, getAttribute, getAttributeValue } from "../../parser/ast";
import { COMPONENT_ATTRIBUTE_NAME } from "../../constants";

export const lintSprite = (ast: Element, context: TranslateContext) => {
  context = lintComponents(ast, context);
  return context;
};

const lintComponents = (ast: Element, context: TranslateContext) => {
  const components = getComponentElements(ast);
  const usedComponents = {};
  const warned = {};
  for (const component of components) {
    const componentName = getAttributeValue(COMPONENT_ATTRIBUTE_NAME, component);

    // TODO - check shape of element, possibly symbol
    if (usedComponents[componentName] && !warned[componentName]) {
      context = addWarning(new Error(`Multiple instance of "${componentName}" exist in document.`), context);
      warned[componentName] = 1;
    }

    usedComponents[componentName] = 1;
  }

  return context;
};