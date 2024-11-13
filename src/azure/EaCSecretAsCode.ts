import { EaCDetails } from "./.deps.ts";
import { EaCSecretDetails } from "./EaCSecretDetails.ts";

export type EaCSecretAsCode = {
  CloudLookup?: string;

  KeyVaultLookup?: string;
} & EaCDetails<EaCSecretDetails>;
