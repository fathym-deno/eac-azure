export * as djwt from "jsr:@zaubrik/djwt@3.0.2";
export type { EverythingAsCode } from "jsr:@fathym/eac@0.1.74";
export type { EaCCloudRoleAssignment } from "../azure/EaCCloudRoleAssignment.ts";
export { Logger } from "jsr:@std/log@0.224.9/logger";
export { delay } from "jsr:@std/async@1.0.8/delay";
export type { EaCCloudDeployment } from "../steward/api/.exports.ts";
export type { EaCActuatorCheckRequest } from "jsr:@fathym/eac@0.2.28/steward/actuators";
export type {
  EaCCloudAsCode,
  EaCCloudAzureDetails,
  EaCCloudDetails,
  EaCCloudResourceAsCode,
  EaCCloudResourceFormatDetails,
  EaCCloudResourceGroupAsCode,
  EaCCloudResourceGroupDetails,
  EaCCloudWithResources,
  EverythingAsCodeClouds,
} from "../azure/.exports.ts";
export {
  isEaCCloudAsCode,
  isEaCCloudAzureDetails,
  isEverythingAsCodeClouds,
} from "../azure/.exports.ts";

export { merge } from "jsr:@fathym/common@0.2.173";
export { getPackageLogger } from "jsr:@fathym/common@0.2.173/log";

export { kebabCase } from "jsr:@luca/cases@1.0.0";

export * as Handlebars from "npm:handlebars@4.7.8/dist/handlebars.min.js";

export {
  type AccessToken,
  ClientSecretCredential,
  type TokenCredential,
} from "npm:@azure/identity@4.4.1";
export { ConfidentialClientApplication } from "npm:@azure/msal-node@2.12.0";
export { KeyClient } from "npm:@azure/keyvault-keys@4.8.0";
export { SecretClient } from "npm:@azure/keyvault-secrets@4.8.0";
export { DataLakeServiceClient } from "npm:@azure/storage-file-datalake@12.23.0";

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
