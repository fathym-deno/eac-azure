export type { EverythingAsCode } from "jsr:@fathym/eac@0.1.74";
export type {
  EaCCloudAsCode,
  EaCCloudAzureDetails,
  EaCCloudDetails,
  EaCCloudResourceAsCode,
  EaCCloudResourceFormatDetails,
  EaCCloudWithResources,
  EverythingAsCodeClouds,
} from "../azure/.exports.ts";
export {
  isEaCCloudAsCode,
  isEaCCloudAzureDetails,
  isEverythingAsCodeClouds,
} from "../azure/.exports.ts";

export { merge } from "jsr:@fathym/common@0.2.161";
export { getPackageLogger } from "jsr:@fathym/common@0.2.161/log";

export { kebabCase } from "jsr:@luca/cases@1.0.0";

export { ResourceManagementClient } from "npm:@azure/arm-resources@5.2.0";
export {
  type AccessToken,
  ClientSecretCredential,
  type TokenCredential,
} from "npm:@azure/identity@4.4.1";
export { ConfidentialClientApplication } from "npm:@azure/msal-node@2.12.0";
export { KeyClient } from "npm:@azure/keyvault-keys@4.8.0";
export { SecretClient } from "npm:@azure/keyvault-secrets@4.8.0";
export { DataLakeServiceClient } from "npm:@azure/storage-file-datalake@12.23.0";
