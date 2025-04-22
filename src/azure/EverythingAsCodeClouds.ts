import { EaCCloudAsCode } from "./EaCCloudAsCode.ts";
import { EaCSecretAsCode } from "./EaCSecretAsCode.ts";
import { EaCWarmQueryAsCode } from "./EaCWarmQueryAsCode.ts";

export type EverythingAsCodeClouds = {
  Clouds?: Record<string, EaCCloudAsCode>;

  Secrets?: Record<string, EaCSecretAsCode>;

  WarmQueries?: Record<string, EaCWarmQueryAsCode>;
};

export function isEverythingAsCodeClouds(
  eac: unknown,
): eac is EverythingAsCodeClouds {
  const x = eac as EverythingAsCodeClouds;

  return x.Clouds !== undefined;
}
