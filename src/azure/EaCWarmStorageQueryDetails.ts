import { EaCVertexDetails } from "./.deps.ts";

export type EaCWarmStorageQueryDetails = {
  Version: number;

  Query: string;
} & EaCVertexDetails;
