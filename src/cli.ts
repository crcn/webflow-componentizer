import * as program from "commander";
import * as fs from "fs";
import * as path from "path";
import {downloadUrl} from './loader';
import {Config} from './index';
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
  console.log(`Downloading ${config.url}`);
  const graph = await downloadUrl(config.url);
  console.log(graph);
};


// pulls the site down 
program
.version(pkg)
.command("pull")
.action(pull);


program.parse(process.argv);