import { Deployment } from "./.deps.ts";

export type EaCCloudDeployment = {
  CloudLookup: string;

  Deployment: Deployment;

  Name: string;

  ResourceGroupLookup: string;
};
