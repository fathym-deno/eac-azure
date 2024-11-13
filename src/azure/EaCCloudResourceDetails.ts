import { EaCVertexDetails } from "./.deps.ts";

export type EaCCloudResourceDetails = {
  Order: number;

  Type: "Format" | "Container";
} & EaCVertexDetails;
