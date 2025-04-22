import { EaCVertexDetails } from "./.deps.ts";

export type EaCWarmQueryDetails = {
  Version: number;

  Query: string;
} & EaCVertexDetails;
