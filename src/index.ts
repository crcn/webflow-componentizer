import { SupportedFramework } from "./translate";


export type Config = {
  sourceUrl: string;
  directory: string;
  framework: SupportedFramework;
  stableVersion?: string;
};