import * as program from "commander";
import * as fs from "fs";
import * as path from "path";
import {downloadDependencyGraph} from "./loader";
import {saveVersionedGraph, writeTypedDefinitionFiles} from "./versioning";
import {Config} from "./index";
import {DEFAULT_CONFIG_FILE_NAME} from "./constants";
const pkg = require("../package");

const cwd = process.cwd();
const configPath = path.join(cwd, DEFAULT_CONFIG_FILE_NAME + ".js");

if (!fs.existsSync(configPath)) {
  console.error(`${DEFAULT_CONFIG_FILE_NAME} file not found in ${cwd}`);
  process.exit(1);
}

const config: Config = require(configPath);

const pull = async () => {
  const graph = await downloadDependencyGraph(config.sourceUrl);
  await saveVersionedGraph(config.directory, graph, config.stableVersion);
};

const buildTypedDefinition = async () => {
  await writeTypedDefinitionFiles(config);
};


// pulls the site down 
program
.version(pkg)
.command("pull")
.action(pull);

// pulls the site down 
program
.version(pkg)
.command("build:typed-definition")
.action(buildTypedDefinition);


program.parse(process.argv);