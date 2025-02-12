import { EaCCloudAsCode } from "./EaCCloudAsCode.ts";
import { EaCSecretAsCode } from "./EaCSecretAsCode.ts";
import { EaCWarmStorageQueryAsCode } from "./EaCWarmStorageQueryAsCode.ts";

export type EverythingAsCodeClouds = {
  Clouds?: Record<string, EaCCloudAsCode>;

  Secrets?: Record<string, EaCSecretAsCode>;

  WarmStorageQueries?: Record<string, EaCWarmStorageQueryAsCode>;
};

export function isEverythingAsCodeClouds(
  eac: unknown,
): eac is EverythingAsCodeClouds {
  const x = eac as EverythingAsCodeClouds;

  return x.Clouds !== undefined;
}
