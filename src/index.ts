export enum SupportedFramework {
  REACT = "react"
};


export type Config = {
  sourceUrl: string;
  directory: string;
  framework: SupportedFramework;
  stableVersion?: string;
};