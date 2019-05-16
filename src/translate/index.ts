import {reactTranslateGroup} from "./react";
import { TranslateGroup } from "./base";
import { Element } from "../parser/ast";
export enum SupportedFramework {
  REACT = "react"
};

export type Translators = {
  [identifier: string]: TranslateGroup;
};

const translators: Translators = {
  [SupportedFramework.REACT]: reactTranslateGroup
};

export const translateCode = (ast: Element, framework: SupportedFramework = SupportedFramework.REACT) => translators[framework].code(ast);
export const translateTypedDefinition = (ast: Element, framework: SupportedFramework = SupportedFramework.REACT) => translators[framework].typedDefinition(ast);
export const translateFlowDefinition = (ast: Element, framework: SupportedFramework = SupportedFramework.REACT) => translators[framework].flowDefinition(ast);