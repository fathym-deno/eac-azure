import { EaCActuatorCheckRequest } from "./.deps.ts";
import { EaCCloudDeployment } from "./EaCCloudDeployment.ts";

export type EaCCloudActuatorCheckRequest =
  & Omit<
    EaCCloudDeployment,
    "Deployment"
  >
  & EaCActuatorCheckRequest;
