import { translateCode, SupportedFramework } from "../../translate";
import { prepareHTMLContentForParser, parseSource } from "../../parser";
import { Element } from "../../parser/ast";
const loaderUtils = require("loader-utils");

// TODO - use options for
module.exports = function(source) {
  this.cacheable && this.cacheable();
  const callback = this.async();
  const uri = this.resource;
  const options = loaderUtils.getOptions(this) || {};

  const ast = parseSource(prepareHTMLContentForParser(source)) as Element;

  const content = translateCode(ast, options.config.framework).buffer;

  // const refMap = getComponentGraphRefMap(entry.content, graph);
  // const depUriMap = {};
  // for (const refId in refMap) {
  //   const ref = getPCNodeDependency(refId, graph);
  //   depUriMap[ref.uri] = 1;
  // }

  // Object.keys(depUriMap).forEach(uri => {
  //   this.addDependency(uri.replace("file://", ""));
  // });

  // callback(null, content);
};
