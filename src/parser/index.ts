
import {Element, Attribute, Node} from './ast';
import {
  Scanner,
  Token,
  BaseTokenizer,
  tokenTypeAsserter,
  throwUnexpectedToken,
  tokenTypeLabelGetter,
} from './parser-utils';
import {ExpressionType, Text} from './ast';

const TOKEN_TYPES = {
  LESS_THAN: 1 << 1, // <
  GREATER_THAN: 1 << 2, // >
  EQUALS: 1 << 3, // =,
  SINGLE_QUOTE: 1 << 4, // ',
  DOUBLE_QUOTE: 1 << 5, // ',
  COLON: 1 << 6, // :,
  WHITESPACE: 1 << 7, // \s\r\n\t
  BACKSLASH: 1 << 8, // /
  START_CLOSE_TAG: 1 << 9, // </
  TEXT: 1 << 30, // a-z0-9,
};

const TOKEN_TYPE_LABELS = {
  [TOKEN_TYPES.LESS_THAN]: '<',
  [TOKEN_TYPES.GREATER_THAN]: '>',
  [TOKEN_TYPES.EQUALS]: '=',
  [TOKEN_TYPES.SINGLE_QUOTE]: "'",
  [TOKEN_TYPES.DOUBLE_QUOTE]: '"',
  [TOKEN_TYPES.COLON]: ':',
  [TOKEN_TYPES.WHITESPACE]: ' ',
  [TOKEN_TYPES.BACKSLASH]: '\\',
  [TOKEN_TYPES.START_CLOSE_TAG]: '</',
  [TOKEN_TYPES.TEXT]: 'a-z0-9',
};

const getTokenTypeLabels = tokenTypeLabelGetter(TOKEN_TYPE_LABELS);
const assertTokenType = tokenTypeAsserter(getTokenTypeLabels);

const TOKEN_TYPE_GROUPS = {
  QUOTE: TOKEN_TYPES.SINGLE_QUOTE | TOKEN_TYPES.DOUBLE_QUOTE,
};

export const parseSource = (source: string) => {
  const root = parseRoot(new Tokenizer(new Scanner(source)));
  return root;
};

const parseRoot = (tokenizer: Tokenizer) => {
  return parseFragment(tokenizer);
};

const parseFragment = (tokenizer: Tokenizer) => {
  const children = parseChildNodes(tokenizer);
  if (children.length === 1) {
    return children[0];
  }
  return {
    type: ExpressionType.FRAGMENT,
    children: children,
  };
};

const parseChildNodes = (tokenizer: Tokenizer) => {
  tokenizer.eatWhitespace();
  const children: Node[] = [];
  while (
    !tokenizer.ended() &&
    (!tokenizer.currentToken ||
      tokenizer.currentToken.type !== TOKEN_TYPES.START_CLOSE_TAG)
  ) {
    children.push(parseChildNode(tokenizer));
    tokenizer.eatWhitespace();
  }
  return children;
};

const parseChildNode = (tokenizer: Tokenizer): Node => {
  const token = tokenizer.currentToken;
  if (token) {
    if (token.type === TOKEN_TYPES.LESS_THAN) {
      return parseElement(tokenizer);
    } else if (token.type === TOKEN_TYPES.TEXT) {
      return parseText(tokenizer);
    }
  }
  throwUnexpectedToken(token);
  return null;
};

// <tagName key="value">children</tagName>
const parseElement = (tokenizer: Tokenizer): Element => {
  const tagNameToken = tokenizer.next(true);
  assertTokenType(tagNameToken, TOKEN_TYPES.TEXT);
  const attributes = parseAttributes(tokenizer);
  // self-closing tag
  if (
    tokenizer.currentToken &&
    tokenizer.currentToken.type === TOKEN_TYPES.BACKSLASH
  ) {
    tokenizer.next(); // eat /
    assertTokenType(tokenizer.currentToken, TOKEN_TYPES.GREATER_THAN);
    tokenizer.next(); // eat >
    return {
      type: ExpressionType.ELEMENT,
      tagName: tagNameToken.value,
      attributes,
      children: [],
    };
  }
  const tagName = tagNameToken.value;

  // do not support self-closing tags for now.
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.GREATER_THAN);
  tokenizer.next(); // eat >

  if (tagName === 'style') {
    // TODO
  }
  const children = parseChildNodes(tokenizer);
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.START_CLOSE_TAG);
  tokenizer.next(); // eat </
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.TEXT);
  tokenizer.next(); // eat tag name
  assertTokenType(tokenizer.currentToken, TOKEN_TYPES.GREATER_THAN);
  tokenizer.next(); // eat >
  return {
    type: ExpressionType.ELEMENT,
    tagName: tagNameToken.value,
    attributes,
    children,
  };
};

const parseText = (tokenizer: Tokenizer): Text => {
  const firstToken = tokenizer.currentToken;
  assertTokenType(firstToken, TOKEN_TYPES.TEXT);
  let buffer: string = firstToken.value;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const token = tokenizer.next();
    if (
      !token ||
      token.type === TOKEN_TYPES.LESS_THAN ||
      token.type === TOKEN_TYPES.START_CLOSE_TAG
    ) {
      break;
    }
    buffer += token.value;
  }

  return {
    type: ExpressionType.TEXT,
    value: buffer,
  };
};

// key="value" key="value" key="value" key="value"
const parseAttributes = (tokenizer: Tokenizer): Attribute[] => {
  const attributes: Attribute[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const token = tokenizer.next();
    if (
      !token ||
      token.type === TOKEN_TYPES.GREATER_THAN ||
      token.type === TOKEN_TYPES.BACKSLASH
    ) {
      break;
    }
    attributes.push(parseAttribute(tokenizer));
  }
  assertTokenType(
    tokenizer.currentToken,
    TOKEN_TYPES.GREATER_THAN | TOKEN_TYPES.BACKSLASH
  );
  return attributes;
};

const parseAttribute = (tokenizer: Tokenizer): Attribute => {
  const keyToken = tokenizer.next();
  assertTokenType(keyToken, TOKEN_TYPES.TEXT);
  const equalsToken = tokenizer.next();
  if (!equalsToken) {
    return {
      type: ExpressionType.ATTRIBUTE,
      key: keyToken.value,
    };
  }
  assertTokenType(equalsToken, TOKEN_TYPES.EQUALS);
  return {
    type: ExpressionType.ATTRIBUTE,
    key: keyToken.value,
    value: parseString(tokenizer),
  };
};

const parseString = (tokenizer: Tokenizer): string => {
  tokenizer.next(true); // eat quote
  assertTokenType(tokenizer.currentToken, TOKEN_TYPE_GROUPS.QUOTE);
  let buffer: string = '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const token = tokenizer.next();
    if (!token || TOKEN_TYPE_GROUPS.QUOTE & token.type) {
      break;
    }
    buffer += token.value;
  }

  assertTokenType(tokenizer.currentToken, TOKEN_TYPE_GROUPS.QUOTE);
  return buffer;
};

class Tokenizer extends BaseTokenizer {
  _scanner: Scanner;
  _current: Token;
  constructor(scanner: Scanner) {
    super(scanner, TOKEN_TYPES.WHITESPACE);
  }
  _next(char: string): Token {
    const position = this._scanner.position;

    // capture single characters
    switch (char) {
      case '<': {
        if (this._scanner.peek() === '/') {
          return {
            type: TOKEN_TYPES.START_CLOSE_TAG,
            position,
            value: char + this._scanner.nextChar(),
          };
        }
        return {type: TOKEN_TYPES.LESS_THAN, position, value: char};
      }
      case '>':
        return {type: TOKEN_TYPES.GREATER_THAN, position, value: char};
      case '=':
        return {type: TOKEN_TYPES.EQUALS, position, value: char};
      case "'":
        return {type: TOKEN_TYPES.SINGLE_QUOTE, position, value: char};
      case '"':
        return {type: TOKEN_TYPES.DOUBLE_QUOTE, position, value: char};
      case ':':
        return {type: TOKEN_TYPES.COLON, position, value: char};
      case '/':
        return {type: TOKEN_TYPES.BACKSLASH, position, value: char};
    }

    // TODO - for now be forgiving about token types and define
    // everything else as text.
    return {
      type: TOKEN_TYPES.TEXT,
      position,
      value: char + (this._scanner.next(/^[^<>='":\s/]+/) || ''),
    };
  }
}
