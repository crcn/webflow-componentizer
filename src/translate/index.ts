import {reactTranslateGroup} from "./react";
import { TranslateGroup, TranslatorType } from "./base";
import { Element } from "../parser/ast";
import { Graph } from "../graph";
import { lintSprite } from "./base/lint";
export enum SupportedFramework {
  REACT = "react"
};

export type Translators = {
  [identifier: string]: TranslateGroup;
};

const translators: Translators = {
  [SupportedFramework.REACT]: reactTranslateGroup
};


const createTranslator = (type: TranslatorType) => (ast: Element, framework: SupportedFramework = SupportedFramework.REACT) => {
  let context = {
    buffer: "",
    entry: ast,
    warnings: [],
    definedObjects: {},
    scopedLabelRefs: {},
    depth: 0
  };

  context = lintSprite(ast, context);

  return translators[framework][type](ast, context);
};

export const translateCode = createTranslator(TranslatorType.CODE);
export const translateTypedDefinition = createTranslator(TranslatorType.TYPED_DEFINITION);
export const translateFlowDefinition = createTranslator(TranslatorType.FLOW_DEFINITION);