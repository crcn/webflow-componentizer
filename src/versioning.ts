import * as fs from "fs";
import * as path from "path";
import * as fsa from "fs-extra";
import { Graph, getGraphDependenciesFromMimeType,  GraphDependencyMimeType} from "./graph";
import {parseSource, prepareHTMLContentForParser} from "./parser";
import { Element, findElementByTagName, findNode, getAttribute, getAttributeValue } from "./parser/ast";
import { Config } from ".";
import { COMMAND_NAME, MAIN_SPRITE_BASENAME } from "./constants";
import { translateTypedDefinition } from "./translate";

/**
 * This file contains utilities for downloading & maintaining versioned
 * sites.
 */

export const saveVersionedGraph = async (directory: string, graph: Graph, stableVersion?: string) => {
  const entries = getGraphDependenciesFromMimeType(GraphDependencyMimeType.HTML, graph);
  if (!entries.length) {
    throw new Error(`main HTML entry point not found.`);
  }
  const mainEntry = entries[0];
  
  const element = parseSource(prepareHTMLContentForParser(mainEntry.content.toString("utf8"))) as Element;
  const body = findElementByTagName(element, "body");
  const version = getAttributeValue("data-version", body) || "trunk";

  const versionDirectory = `${directory}/${version}`;

  try {
    fsa.mkdirpSync(versionDirectory);
  } catch(e) {

  }

  for (const uri in graph) {
    const dependency = graph[uri];
    const basename = uri === mainEntry.url ? MAIN_SPRITE_BASENAME : path.basename(uri);
    const versionedFilePath = `${versionDirectory}/${basename}`;
    console.info(`Writing ${versionedFilePath}`);
    fs.writeFileSync(versionedFilePath, dependency.content);
  }

  const latestDirectory = `${directory}/latest`;

  try {
    fs.unlinkSync(latestDirectory);
  } catch(e) {

  }

  try {
    fsa.symlinkSync(versionDirectory, latestDirectory);
    console.info(`Symlink ${latestDirectory} -> ${versionDirectory}`);

  } catch(e) {

  }

  if (stableVersion) {

    const stableDirectory = `${directory}/stable`;
    const stableVersionDirectory = path.join(directory, stableVersion);

    try {
      fs.unlinkSync(stableDirectory);
    } catch(e) {

    }

    try {
      fsa.symlinkSync(stableVersionDirectory, stableDirectory);
      console.info(`Symlink ${stableDirectory} -> ${stableVersionDirectory}`);

    } catch(e) {

    }
  }
};

export const writeTypedDefinitionFiles = async ({directory}: Config) => {
  const versions = fs.readdirSync(directory).filter(name => !/^\./.test(name));
  if (!versions.length) {
    console.error(`You need to call "${COMMAND_NAME} pull" before building typed definitions`);
    return;
  }
  for (const version of versions) {
    const versionPath = path.join(directory, version);
    const stat = fs.lstatSync(versionPath);
    if (stat.isSymbolicLink()) {
      continue;
    }
    const spriteFilePath = path.join(versionPath, MAIN_SPRITE_BASENAME);
    if (!fs.existsSync(spriteFilePath)) {
      console.warn(`${spriteFilePath} not found, skipping.`);
      continue;
    }

    const content = fs.readFileSync(spriteFilePath, "utf8");
    const tdContent = translateTypedDefinition(parseSource(prepareHTMLContentForParser(content)) as Element);
    const tdFilePath = spriteFilePath + ".d.ts";
    console.info(`Writing ${tdFilePath}`);
    fs.writeFileSync(tdFilePath, tdContent);
  }
};