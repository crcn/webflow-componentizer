// @flow

import {
  StyleSheet,
  StyleRule,
  StyleDeclaration,
  MediaRule,
  Rule,
  FontFaceRule,
  AtRule,
  KeyFramesRule,
} from './css-ast';
import {CSSExpressionType} from './css-ast';
import {
  BaseTokenizer,
  Scanner,
  Token,
  tokenTypeLabelGetter,
  tokenTypeAsserter,
} from './parser-utils';

const TOKEN_TYPES = {
  OPEN_BRACKET: 1 << 1, // {
  CLOSE_BRACKET: 1 << 2, // }
  COLON: 1 << 3, // :
  SEMICOLON: 1 << 4, // ;
  WHITESPACE: 1 << 5, // \s\r\n\t
  TEXT: 1 << 30, // a-z0-9,
};

const TOKEN_TYPE_LABELS = {
  [TOKEN_TYPES.OPEN_BRACKET]: '{',
  [TOKEN_TYPES.CLOSE_BRACKET]: '}',
  [TOKEN_TYPES.COLON]: ':',
  [TOKEN_TYPES.SEMICOLON]: ';',
  [TOKEN_TYPES.WHITESPACE]: 'whitespace',
  [TOKEN_TYPES.TEXT]: 'a-z0-9',
};

const getTokenTypeLabels = tokenTypeLabelGetter(TOKEN_TYPE_LABELS);
const assertTokenType = tokenTypeAsserter(getTokenTypeLabels);

export const parseCSS = (content: string) => {
  return parseStyleSheet(new CSSTokenizer(new Scanner(content)));
};

const parseStyleSheet = (tokenizer: CSSTokenizer): StyleSheet => {
  return {
    type: CSSExpressionType.STYLE_SHEET,
    rules: parseChildRules(() => !tokenizer.ended())(tokenizer),
  };
};

const parseChildRules = test => (tokenizer): Rule[] => {
  const rules: Rule[] = [];
  while (test()) {
    rules.push(parseRule(tokenizer));
  }
  return rules;
};

const parseRule = (tokenizer: CSSTokenizer): Rule => {
  tokenizer.eatWhitespace();
  const token = tokenizer.currentToken;
  assertTokenType(token, TOKEN_TYPES.TEXT);
  if (token.value.trim().charAt(0) === '@') {
    return parseAtRule(tokenizer);
  }

  return parseStyleRule(tokenizer);
};

const parseAtRule = (tokenizer: CSSTokenizer): AtRule => {
  const name = tokenizer.currentToken.value;
  tokenizer.next(); // eat name
  if (name === '@font-face') {
    return parseFontFaceRule(tokenizer);
  } else if (name === '@media') {
    return parseMediaRule(tokenizer);
  } else if (name === '@keyframes') {
    return parseKeyFramesRule(tokenizer);
  } else {
    throw new Error(`Unknown @ rule ${name}`);
  }
};

const parseFontFaceRule = (tokenizer: CSSTokenizer): FontFaceRule => {
  tokenizer.eatWhitespace(); // font name
  const declarations = parseStyleRuleDeclarations(tokenizer);
  return {
    type: CSSExpressionType.FONT_FACE_RULE,
    declarations,
  };
};

const parseKeyFramesRule = (tokenizer: CSSTokenizer): KeyFramesRule => {
  tokenizer.eatWhitespace();
  const name = tokenizer.currentToken.value;
  tokenizer.next(true); // eat name
  parseKeyFrames(tokenizer); // eat for now

  return {
    type: CSSExpressionType.KEY_FRAMES_RULE,
    name,
  };
};

const parseKeyFrames = (tokenizer: CSSTokenizer) => {
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.OPEN_BRACKET);
  tokenizer.next(true);
  const keyframes = [];
  // eslint-disable-next-line no-constant-condition
  while (1) {
    tokenizer.eatWhitespace();
    if (
      !tokenizer.currentToken ||
      tokenizer.currentToken.type === TOKEN_TYPES.CLOSE_BRACKET
    ) {
      break;
    }
    keyframes.push(parseKeyFrame(tokenizer));
  }
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.CLOSE_BRACKET);
  tokenizer.next(); // eat }
  return keyframes;
};

const parseKeyFrame = (tokenizer: CSSTokenizer) => {
  const name = scanBufferUntil(TOKEN_TYPES.OPEN_BRACKET, tokenizer);

  return {
    name,
    declarations: parseStyleRuleDeclarations(tokenizer),
  };
};

const parseMediaRule = (tokenizer: CSSTokenizer): MediaRule => {
  const conditionText = scanBufferUntil(
    TOKEN_TYPES.OPEN_BRACKET,
    tokenizer
  ).trim();
  tokenizer.next(); // eat {
  const rules = parseChildRules(() => {
    tokenizer.eatWhitespace();
    return (
      !tokenizer.currentToken ||
      tokenizer.currentToken.type !== TOKEN_TYPES.CLOSE_BRACKET
    );
  })(tokenizer);
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.CLOSE_BRACKET);
  tokenizer.next(); // eat }

  return {
    type: CSSExpressionType.MEDIA_RULE,
    conditionText,
    rules,
  };
};

const parseStyleRule = (tokenizer: CSSTokenizer): StyleRule => {
  const selector = scanBufferUntil(TOKEN_TYPES.OPEN_BRACKET, tokenizer).trim();
  const declarations = parseStyleRuleDeclarations(tokenizer);
  return {
    type: CSSExpressionType.STYLE_RULE,
    selector,
    declarations,
  };
};

const parseStyleRuleDeclarations = (
  tokenizer: CSSTokenizer
): StyleDeclaration[] => {
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.OPEN_BRACKET);
  tokenizer.next(); // eat {
  const declarations = [];
  // eslint-disable-next-line no-constant-condition
  while (1) {
    tokenizer.eatWhitespace();
    if (tokenizer.currentToken.type === TOKEN_TYPES.CLOSE_BRACKET) {
      break;
    }
    declarations.push(parseStyleRuleDeclaration(tokenizer));
  }
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.CLOSE_BRACKET);
  tokenizer.next(); // eat }
  return declarations;
};
const parseStyleRuleDeclaration = (
  tokenizer: CSSTokenizer
): StyleDeclaration => {
  const name = scanBufferUntil(TOKEN_TYPES.COLON, tokenizer).trim();
  tokenizer.next(); // eat :
  const value = scanBufferUntil(
    TOKEN_TYPES.SEMICOLON | TOKEN_TYPES.CLOSE_BRACKET,
    tokenizer
  ).trim();
  if (tokenizer.currentToken.type === TOKEN_TYPES.SEMICOLON) {
    tokenizer.next(); // eat ;
  }
  return {
    type: CSSExpressionType.STYLE_DECLARATION,
    name,
    value,
  };
};

const scanBufferUntil = (type: number, tokenizer: CSSTokenizer) => {
  const buffer = [tokenizer.currentToken.value];

  // eslint-disable-next-line no-constant-condition
  while (1) {
    tokenizer.next();
    if (!tokenizer.currentToken || tokenizer.currentToken.type & type) {
      break;
    }
    buffer.push(tokenizer.currentToken.value);
  }
  assertTokenType(tokenizer.currentToken, type);
  return buffer.join('');
};
class CSSTokenizer extends BaseTokenizer {
  constructor(scanner: Scanner) {
    super(scanner, TOKEN_TYPES.WHITESPACE);
  }
  _next(char: string): Token {
    const position = this._scanner.position;

    switch (char) {
      case '{': {
        return {
          type: TOKEN_TYPES.OPEN_BRACKET,
          value: char,
          position,
        };
      }
      case '}': {
        return {
          type: TOKEN_TYPES.CLOSE_BRACKET,
          position,
          value: char,
        };
      }
      case ':': {
        return {
          type: TOKEN_TYPES.COLON,
          position,
          value: char,
        };
      }
      case ';': {
        return {
          type: TOKEN_TYPES.SEMICOLON,
          position,
          value: char,
        };
      }
    }

    const text = char + (this._scanner.next(/^[^{:;}\s\r\n\t]+/) || '');

    return {
      type: TOKEN_TYPES.TEXT,
      position,
      value: text,
    };
  }
}
