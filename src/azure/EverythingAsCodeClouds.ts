// deno-lint-ignore-file no-explicit-
import { z } from "./.deps.ts";
import { EaCCloudAsCode, EaCCloudAsCodeSchema } from "./EaCCloudAsCode.ts";
import { EaCSecretAsCode, EaCSecretAsCodeSchema } from "./EaCSecretAsCode.ts";
import {
  EaCWarmQueryAsCode,
  EaCWarmQueryAsCodeSchema,
} from "./EaCWarmQueryAsCode.ts";

/**
 * Represents cloud-specific configuration in the Everything-as-Code model.
 * Includes Clouds, Secrets, and WarmQueries as modular records.
 */
export type EverythingAsCodeClouds = {
  /** Declarative configuration for cloud providers (e.g., AWS, Azure, GCP). */
  Clouds?: Record<string, EaCCloudAsCode>;

  /** Secrets linked to cloud environments, including API keys and credentials. */
  Secrets?: Record<string, EaCSecretAsCode>;

  /** Predefined warm queries or pinned endpoints for low-latency access. */
  WarmQueries?: Record<string, EaCWarmQueryAsCode>;
};

/**
 * Zod schema for `EverythingAsCodeClouds`.
 */
export const EverythingAsCodeCloudsSchema: z.ZodObject<
  {
    Clouds: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodType<EaCCloudAsCode, z.ZodTypeDef, EaCCloudAsCode>
      >
    >;
    Secrets: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodType<EaCSecretAsCode, z.ZodTypeDef, EaCSecretAsCode>
      >
    >;
    WarmQueries: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodType<EaCWarmQueryAsCode, z.ZodTypeDef, EaCWarmQueryAsCode>
      >
    >;
  },
  "strip",
  z.ZodTypeAny,
  EverythingAsCodeClouds,
  EverythingAsCodeClouds
> = z
  .object({
    Clouds: z
      .record(EaCCloudAsCodeSchema)
      .optional()
      .describe("Cloud provider configurations keyed by ID or name."),
    Secrets: z
      .record(EaCSecretAsCodeSchema)
      .optional()
      .describe("Secrets mapped by ID or alias for runtime or deployment use."),
    WarmQueries: z
      .record(EaCWarmQueryAsCodeSchema)
      .optional()
      .describe("Pinned warm queries optimized for low-latency execution."),
  })
  .describe(
    "Everything-as-Code configuration for cloud services, secrets, and warm queries.",
  );

/**
 * Type guard for `EverythingAsCodeClouds`.
 */
export function isEverythingAsCodeClouds(
  value: unknown,
): value is EverythingAsCodeClouds {
  if (EverythingAsCodeCloudsSchema.safeParse(value).success) {
    return typeof (value as any).Clouds != "undefined";
  } else {
    return false;
  }
}

/**
 * Validates and parses an object as `EverythingAsCodeClouds`.
 */
export function parseEverythingAsCodeClouds(
  value: unknown,
): EverythingAsCodeClouds {
  return EverythingAsCodeCloudsSchema.parse(value);
}
