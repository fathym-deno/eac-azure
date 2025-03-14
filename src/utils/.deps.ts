export { Logger } from "jsr:@std/log@0.224.14/logger";
export { delay } from "jsr:@std/async@1.0.8/delay";

export { merge } from "jsr:@fathym/common@0.2.179";
export { djwt } from "jsr:@fathym/common@0.2.179/jwt";
export { getPackageLogger } from "jsr:@fathym/common@0.2.179/log";

export type { EverythingAsCode } from "jsr:@fathym/eac@0.2.101";
export type { EaCActuatorCheckRequest } from "jsr:@fathym/eac@0.2.101/steward/actuators";

export { kebabCase } from "jsr:@luca/cases@1.0.0";

import Handlebars from "npm:handlebars@4.7.8/dist/handlebars.min.js";
export { Handlebars };

export {
  type AccessToken,
  ClientSecretCredential,
  type TokenCredential,
} from "npm:@azure/identity@4.7.0";
export { ConfidentialClientApplication } from "npm:@azure/msal-node@2.16.2";
export { KeyClient } from "npm:@azure/keyvault-keys@4.9.0";
export { SecretClient } from "npm:@azure/keyvault-secrets@4.9.0";
export { DataLakeServiceClient } from "npm:@azure/storage-file-datalake@12.25.0";

export { AuthorizationManagementClient } from "npm:@azure/arm-authorization@9.0.0";
export {
  type Deployment,
  type DeploymentExtended,
  type GenericResourceExpanded,
  ResourceManagementClient,
} from "npm:@azure/arm-resources@5.2.0";
export { SubscriptionClient } from "npm:@azure/arm-subscriptions@5.1.0";
export {
  type AuthenticationProvider,
  type AuthenticationProviderOptions,
  Client as GraphClient,
} from "npm:@microsoft/microsoft-graph-client@3.0.7";
export {
  type Application,
  type PasswordCredential,
  type ServicePrincipal,
} from "npm:@microsoft/microsoft-graph-types@2.40.0";

export type {
  EaCCloudAsCode,
  EaCCloudAzureDetails,
  EaCCloudDetails,
  EaCCloudResourceAsCode,
  EaCCloudResourceFormatDetails,
  EaCCloudResourceGroupAsCode,
  EaCCloudResourceGroupDetails,
  EaCCloudRoleAssignment,
  EaCCloudWithResources,
  EverythingAsCodeClouds,
} from "../azure/.exports.ts";
export {
  isEaCCloudAsCode,
  isEaCCloudAzureDetails,
  isEverythingAsCodeClouds,
} from "../azure/.exports.ts";

export type { EaCCloudDeployment } from "../steward/api/.exports.ts";
