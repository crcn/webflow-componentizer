import { Element, findElementByTagName, getAttributeValue, filterElementsByTagName, Node, ExpressionType, Text } from "../../parser/ast";
import { TranslateContext, addLine, getComponentElements, addOpenTag, addCloseTag, addBuffer } from "../base/utils";
import { COMPONENT_ATTRIBUTE_NAME, LAYER_ATTRIBUTE_NAME, SLOT_ATTRIBUTE_NAME } from "../../constants";
import { getComponentClassName, getLayerPropName, getLayerSlotPropName } from "./utils";

/**
 */

export const translateHTMLToCode = (ast: Element, context: TranslateContext) => {
  const links = filterElementsByTagName(ast, "link");
  for (const link of links) {
    const type = getAttributeValue("rel", link);
    if (type === "stylesheet") {
      const href = getAttributeValue("href", link);
      context = addLine(`import "${href}";`, context);
    }
  }

  context = addLine(`import * as React from "react";\n`, context);
  context = translateComponents(ast, context);

  return context;
};

const translateComponents = (ast: Element, context: TranslateContext) => {
  const components = getComponentElements(ast);
  const used = {};
  for (const component of components) {
    const name = getAttributeValue(COMPONENT_ATTRIBUTE_NAME, component);
    if (used[name]) {
      continue;
    }
    used[name] = 1;
    context = translateComponent(component, context);
  }
  return context;
};

const translateComponent = (component: Element, context: TranslateContext) => {
  const className = getComponentClassName(component);
  context = addOpenTag(`export class ${className} extends React.Component {`, context);
  context = addOpenTag(`render() {\n`, context);
  context = addBuffer(`return`, context);
  context = translateRenderNode(component, context);
  context = addBuffer(`;`, context);
  context = addCloseTag(`}\n`, context);
  context = addCloseTag(`}\n\n`, context);
  return context;
};

const translateRenderNode = (node: Node, context: TranslateContext) => {
  if (node.type === ExpressionType.ELEMENT) {
    return translateRenderElement(node, context);
  } else if (node.type === ExpressionType.TEXT) {
    return transalteRenderText(node, context);
  }
  return context;
};

const ATTR_NAME_ALIASES = {
  "class": "className"
};

const translateRenderElement = (element: Element, context: TranslateContext) => {
  context = addOpenTag(`React.createElement(\n`, context);
  context = addLine(`"${element.tagName}",`, context);

  context = addOpenTag(`{\n`, context);
  for (const attribute of element.attributes) {
    const reactAttrName = ATTR_NAME_ALIASES[attribute.key] || attribute.key;
    context = addLine(`"${reactAttrName}": "${getEscapedString(attribute.value)}", `, context);
  }
  const name = getAttributeValue(LAYER_ATTRIBUTE_NAME, element);
  if (name) {
    const propName = getLayerPropName(element);
    context = addLine(`...(this.props.${propName} || {}),`, context);
  }
  context = addCloseTag(`}`, context);

  if (element.children.length) {
    const slotName = getAttributeValue(SLOT_ATTRIBUTE_NAME, element);
    if (slotName) {
      const ref = `this.props.${getLayerSlotPropName(element)}`;
      context = addOpenTag(`, ${ref} != null ? ${ref} : [\n`, context);
    } else {
      context = addOpenTag(", [\n", context);
    }
  }

  for (const child of element.children) {
    context = translateRenderNode(child as Node, context);
    context = addLine(",", context);
  }

  if (element.children.length) {
    context = addCloseTag("]", context);
  }

  context = addCloseTag(`)`, context);
  
  return context;
};

const transalteRenderText = (node: Text, context: TranslateContext) => {
  context = addBuffer(`"${getEscapedString(node.value)}"`, context);
  return context;
};

const getEscapedString = (value: string) => {
  return value.replace(/[\n\r]/g, "\\n").replace(/"/g, "\\\"");
};