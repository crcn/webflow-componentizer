import { Element, filterNodes, ExpressionType, getAttributeValue } from "../../parser/ast";
import { TranslateContext, getComponentElements, addLine, addOpenTag, addCloseTag } from "../base/utils";
import { COMPONENT_ATTRIBUTE_NAME } from "../../constants";
import { getComponentClassName, getNamedNodes, getLayerPropName, getSlots, getLayerSlotPropName } from "./utils";


// TODO 
export const translateHTMLToTypedDefinion = (ast: Element, context: TranslateContext) => {
  context = addLine(`import * as React from "react"`, context);
  context = addLine("", context);
  context = translateComponents(ast, context);
  return context;
};

const translateComponents = (ast: Element, context: TranslateContext) => {
  const components = getComponentElements(ast);
  const compiledComponents = {};
  for (const component of components) {
    const componentName = getAttributeValue(COMPONENT_ATTRIBUTE_NAME, component);
    if (compiledComponents[componentName]) {
      continue;
    }
    context = translateComponent(component, context);
    compiledComponents[componentName] = 1;
  }
  return context;
};

const translateComponent = (component: Element, context: TranslateContext) => {
  const className = getComponentClassName(component);
  const propsTypeName = `${className}Props`;
  context = addOpenTag(`type ${propsTypeName} = {\n`, context);
  context = translateComponentProps(component, context);
  context = addCloseTag(`};\n\n`, context);

  context = addLine(`export class ${className} extends React.Component<${propsTypeName}> { }\n`, context);
  return context;
};

const translateComponentProps = (component: Element, context: TranslateContext) => {
  const namedLayers = getNamedNodes(component);
  const slots = getSlots(component);
  for (const namedLayer of namedLayers) {
    const propName = getLayerPropName(namedLayer);
    context = addLine(`${propName}: React.HTMLAttributes<any>;`, context);
  }
  for (const slot of slots) {
    const propName = getLayerSlotPropName(slot);
    context = addLine(`${propName}: any;`, context);
  }

  return context;
}
