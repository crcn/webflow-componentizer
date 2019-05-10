export type Token = {
  type: number,
  value: string,
  position: number,
};

export class Scanner {
  position: number = 0;
  _source: string;
  _currentChar: string;
  constructor(source: string) {
    this._source = source;
  }
  ended() {
    return this.position >= this._source.length;
  }
  next(pattern: RegExp) {
    const rest = this._source.substr(this.position);
    const match = rest.match(pattern);
    if (!match) {
      return;
    }
    const match0 = match[0];
    this.position += rest.indexOf(match0) + match0.length;
    return match0;
  }
  nextChar() {
    return (this._currentChar = this._source.charAt(this.position++));
  }
  currChar() {
    return this._currentChar;
  }
  peek(count: number = 1) {
    return this._source.substr(this.position, count);
  }
}

export class BaseTokenizer {
  _scanner: Scanner;
  _current?: Token;
  _whitespaceTokenType: number;
  constructor(scanner: Scanner, whitespaceTokenType: number) {
    this._scanner = scanner;
    this._whitespaceTokenType = whitespaceTokenType;

    // queue up first token
    this.next();
  }
  get currentToken() {
    return this._current;
  }
  ended() {
    return this._scanner.ended();
  }
  eatWhitespace() {
    if (
      this.currentToken &&
      this.currentToken.type === this._whitespaceTokenType
    ) {
      this.next();
    }
  }
  peek(eatWhitespace: boolean = false): Token {
    const position = this._scanner.position;
    const token = this.next(eatWhitespace);
    this._scanner.position = position;
    return token;
  }
  next(eatWhitespace: boolean = false) {
    if (this._scanner.ended()) {
      this._current = undefined;
      return;
    }
    const char = this._scanner.nextChar();
    const position = this._scanner.position;
    if (/[\s\r\n\t]/.test(char)) {
      const value = char + (this._scanner.next(/^[\s\r\n\t]+/) || '');
      if (eatWhitespace) {
        return this.next(eatWhitespace);
      }
      return (this._current = {
        type: this._whitespaceTokenType,
        position,
        value,
      });
    }
    this._current = this._next(char);
    return this._current;
  }

  // eslint-disable-next-line no-unused-vars
  _next(char: string): Token  {
    // OVERRIDE ME
    return null;
  }
}

export const throwUnexpectedToken = (token: Token) => {
  if (!token) {
    throw new Error(`Unexpected end of file.`);
  }

  // TODO: display lines here to
  throw new Error(`Unexpected token ${token.value}`);
};

export const tokenTypeAsserter = (getTokenTypeLabels: (number) => string[]) => (
  token: Token,
  type: number
) => {
  if (!token) {
    throwUnexpectedToken(token);
    return false;
  }
  if (!(type & token.type)) {
    throw new Error(
      `Unexpected token ${token.value}, expected ${getTokenTypeLabels(type)
        .map(label => `'${label}'`)
        .join(', ')}`
    );
  }
};

export const tokenTypeLabelGetter = (tokenLabelMap: {
  [identifier: string]: string,
}) => (tokenType: number) => {
  const labels: string[] = [];
  for (const type in tokenLabelMap) {
    if (tokenType & Number(type)) {
      labels.push(tokenLabelMap[type]);
    }
  }
  return labels;
};
