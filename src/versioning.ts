import * as fs from "fs";
import * as path from "path";
import * as fsa from "fs-extra";
import { Graph, getGraphDependenciesFromMimeType,  GraphDependencyMimeType} from "./graph";
import {parseSource, prepareHTMLContentForParser} from "./parser";
import { Element, findElementByTagName, findNode, getAttribute, getAttributeValue } from "./parser/ast";

/**
 * This file contains utilities for downloading & maintaining versioned
 * sites.
 */

export const saveVersionedGraph = async (directory: string, graph: Graph) => {
  const entries = getGraphDependenciesFromMimeType(GraphDependencyMimeType.HTML, graph);
  if (!entries.length) {
    throw new Error(`main HTML entry point not found.`);
  }
  const mainEntry = entries[0];
  
  const element = parseSource(prepareHTMLContentForParser(mainEntry.content.toString("utf8"))) as Element;
  const body = findElementByTagName(element, "body");
  const version = getAttributeValue("data-version", body) || "_unversioned";

  const versionDirectory = `${directory}/${version}`;

  try {
    fsa.mkdirpSync(versionDirectory);
  } catch(e) {

  }

  for (const uri in graph) {
    const dependency = graph[uri];
    const basename = uri === mainEntry.url ? "index.html" : path.basename(uri);
    const versionedFilePath = `${versionDirectory}/${basename}`;
    console.info(`Writing ${versionedFilePath}`);
    fs.writeFileSync(versionedFilePath, dependency.content);
  }

  const latestDirectory = `${directory}/latest`;

  try {
    fsa.symlinkSync(versionDirectory, latestDirectory);
    console.info(`Symlink ${latestDirectory} -> ${versionDirectory}`);

  } catch(e) {

  }

  fsa.symlinkSync
};