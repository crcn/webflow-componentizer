import { Element } from "../../parser/ast";

export type Translator = (ast: Element) => string;

export type TranslateGroup = {
  code: Translator;
  typedDefinition?: Translator;
  flowDefinition?: Translator;
};
