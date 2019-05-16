import { Element } from "../../parser/ast";
import { TranslateContext } from "./utils";

export type Translator = (ast: Element, context: TranslateContext) => TranslateContext;
export enum TranslatorType {
  CODE = "code",
  TYPED_DEFINITION = "typedDefinition",
  FLOW_DEFINITION = "flowDefinition"
};

export type TranslateGroup = {
  [TranslatorType.CODE]: Translator;
  [TranslatorType.TYPED_DEFINITION]?: Translator;
  [TranslatorType.FLOW_DEFINITION]?: Translator;
};
