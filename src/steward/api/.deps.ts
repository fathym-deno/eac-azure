export { merge } from "jsr:@fathym/common@0.2.273";

export type { EverythingAsCode } from "jsr:@fathym/eac@0.2.130";
export { type EaCRuntimeHandlers } from "jsr:@fathym/eac@0.2.130/runtime/pipelines";
export type {
  EaCActuatorCheckRequest,
  EaCActuatorCheckResponse,
  EaCActuatorConnectionsRequest,
  EaCActuatorConnectionsResponse,
  EaCActuatorErrorResponse,
  EaCActuatorRequest,
  EaCActuatorResponse,
} from "jsr:@fathym/eac@0.2.130/steward/actuators";

export { resolveDynamicValues } from "jsr:@fathym/eac-applications@0.0.203/utils";
export type { EaCStewardAPIState } from "jsr:@fathym/eac-applications@0.0.203/steward/api";

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
  GraphPermissionError,
  loadAzureCloudCredentials,
  loadCloudResourceGroupsConnections,
  loadDeploymentDetails,
  loadMainSecretClient,
  loadSecretClient,
} from "../../utils/.exports.ts";
