import { EaCCloudAsCode } from "./EaCCloudAsCode.ts";
import { EaCSecretAsCode } from "./EaCSecretAsCode.ts";

export type EverythingAsCodeClouds = {
  Clouds?: Record<string, EaCCloudAsCode>;

  Secrets?: Record<string, EaCSecretAsCode>;
};

export function isEverythingAsCodeClouds(
  eac: unknown,
): eac is EverythingAsCodeClouds {
  const x = eac as EverythingAsCodeClouds;

  return x.Clouds !== undefined;
}
