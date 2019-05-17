import { translateCode, SupportedFramework } from "../../translate";
import { prepareHTMLContentForParser, parseSource } from "../../parser";
import { Element, filterElementsByTagName, getAttributeValue } from "../../parser/ast";
const loaderUtils = require("loader-utils");

// TODO - use options for
module.exports = function(source) {
  this.cacheable && this.cacheable();
  const callback = this.async();
  const options = loaderUtils.getOptions(this) || {};
  const ast = parseSource(prepareHTMLContentForParser(source.toString("utf8"))) as Element;
  const content = translateCode(ast, options.config.framework || SupportedFramework.REACT).buffer;

  const links = filterElementsByTagName(ast, "link");
  for (const link of links) {
    const href = getAttributeValue("href", link);
    if (href) {
      this.addDependency(href);
    }
  }

  callback(null, content);
};
