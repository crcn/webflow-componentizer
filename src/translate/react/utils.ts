import {camelCase} from "lodash";
import { Element, getAttributeValue, filterNodes, ExpressionType, traverseNodes } from "../../parser/ast";
import { COMPONENT_ATTRIBUTE_NAME, LAYER_ATTRIBUTE_NAME } from "../../constants";

const getVarName = (value: string) => {
  const camelName = camelCase(value);
  return camelName;
};

const getClassName = (value: string) => {
  const varName = getVarName(value);
  return varName.charAt(0).toUpperCase() + varName.substr(1);
};

export const getComponentClassName = (component: Element) => {
  return `Base${getClassName(getAttributeValue(COMPONENT_ATTRIBUTE_NAME, component))}`;
};

export const getNamedNodes = (component: Element) => {
  const labeledNodes = [];
  
  traverseNodes(component, child => {
    if (child.type === ExpressionType.ELEMENT) {
      if (getAttributeValue(LAYER_ATTRIBUTE_NAME, child)) {
        labeledNodes.push(child);
      }

      if (getAttributeValue(COMPONENT_ATTRIBUTE_NAME, child) && child !== component) {
        return false;
      }
    }
  });

  return labeledNodes;
}

export const getLayerPropName = (layer: Element) => {
  const name = getAttributeValue(LAYER_ATTRIBUTE_NAME, layer);
  return getVarName(name) + "Props";
};