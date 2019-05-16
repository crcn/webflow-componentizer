import {translateHTMLToCode} from "./code";
import {translateHTMLToTypedDefinion} from "./typed-definition";
import { TranslateGroup } from "../base";

export const reactTranslateGroup: TranslateGroup = {
  code: translateHTMLToCode,
  typedDefinition: translateHTMLToTypedDefinion
};