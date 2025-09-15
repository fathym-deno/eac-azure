export { merge } from "jsr:@fathym/common@0.2.266";

export type { EverythingAsCode } from "jsr:@fathym/eac@0.2.120";
export { type EaCRuntimeHandlers } from "jsr:@fathym/eac@0.2.120/runtime/pipelines";
export type {
  EaCActuatorCheckRequest,
  EaCActuatorCheckResponse,
  EaCActuatorConnectionsRequest,
  EaCActuatorConnectionsResponse,
  EaCActuatorErrorResponse,
  EaCActuatorRequest,
  EaCActuatorResponse,
} from "jsr:@fathym/eac@0.2.120/steward/actuators";

export { resolveDynamicValues } from "jsr:@fathym/eac-applications@0.0.190/utils";
export type { EaCStewardAPIState } from "jsr:@fathym/eac-applications@0.0.190/steward/api";

export type { Deployment } from "npm:@azure/arm-resources@5.2.0";

export type {
  EaCCloudAsCode,
  EaCCloudAzureDetails,
  EaCSecretAsCode,
  EverythingAsCodeClouds,
} from "../../azure/.exports.ts";
export { isEaCCloudAzureDetails } from "../../azure/.exports.ts";

export {
  beginEaCDeployments,
  buildCloudDeployments,
  deconstructCloudDetailsSecrets,
  eacGetSecrets,
  eacSetSecrets,
  ensureRoleAssignments,
  finalizeCloudDetails,
  loadAzureCloudCredentials,
  loadCloudResourceGroupsConnections,
  loadDeploymentDetails,
  loadMainSecretClient,
  loadSecretClient,
} from "../../utils/.exports.ts";
