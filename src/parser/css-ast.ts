// @flow
import {BaseExpression} from './base-ast';

export enum CSSExpressionType {
  STYLE_SHEET = 'STYLE_SHEET',
  MEDIA_RULE = 'MEDIA_RULE',
  FONT_FACE_RULE = 'FONT_FACE_RULE',
  KEY_FRAMES_RULE = 'KEY_FRAMES_RULE',
  STYLE_RULE = 'STYLE_RULE',
  STYLE_DECLARATION = 'STYLE_DECLARATION',
};

type BaseGroupRule<TType> = {
  rules: any[],
} & BaseExpression<TType>;

export type StyleSheet = BaseGroupRule<typeof CSSExpressionType.STYLE_SHEET>;

export type StyleRule = {
  selector: string,
  declarations: StyleDeclaration[],
} & BaseExpression<typeof CSSExpressionType.STYLE_RULE>;

export type StyleDeclaration = {
  name: string,
  value: string,
} & BaseExpression<CSSExpressionType.STYLE_DECLARATION>;

export type MediaRule = {
  conditionText: string,
} & BaseGroupRule<CSSExpressionType.MEDIA_RULE>;

export type FontFaceRule = {
  declarations: StyleDeclaration[],
} & BaseExpression<CSSExpressionType.FONT_FACE_RULE>;

// TODO - functionality is incomplete here since we don't have
// any use for keyframes (yet?)
export type KeyFramesRule = {
  name: string,
} & BaseExpression<CSSExpressionType.KEY_FRAMES_RULE>;

export type AtRule = MediaRule | FontFaceRule | KeyFramesRule;
export type Rule = AtRule | StyleRule;
