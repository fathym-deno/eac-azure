// deno-lint-ignore-file no-explicit-any
import { z } from "./.deps.ts";
import {
  EaCCloudResourceAsCode,
  EaCCloudResourceAsCodeSchema,
} from "./EaCCloudResourceAsCode.ts";

/**
 * Represents a reusable mixin structure for nodes that support nested cloud resources.
 */
export type EaCCloudWithResources = {
  /** Optional mapping of nested cloud resources by name. */
  Resources?: Record<string, EaCCloudResourceAsCode>;
};

/**
 * Schema for `EaCCloudWithResources`.
 * Supports optional recursive mapping of nested `EaCCloudResourceAsCode` entries.
 */
export const EaCCloudWithResourcesSchema: z.ZodObject<
  {
    Resources: z.ZodOptional<z.ZodLazy<z.ZodRecord<z.ZodString, any>>>;
  },
  "strip",
  z.ZodTypeAny,
  EaCCloudWithResources,
  EaCCloudWithResources
> = z
  .object({
    Resources: z
      .lazy(
        (): z.ZodRecord<z.ZodString, any> =>
          z.record(EaCCloudResourceAsCodeSchema),
      )
      .optional()
      .describe("Optional mapping of nested cloud resources."),
  })
  .strip()
  .describe(
    "Schema for objects that support nested cloud resources in Everything-as-Code (EaC).",
  );

/**
 * Type guard for `EaCCloudWithResources`.
 */
export function isEaCCloudWithResources(
  value: unknown,
): value is EaCCloudWithResources {
  return EaCCloudWithResourcesSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudWithResources`.
 */
export function parseEaCCloudWithResources(
  value: unknown,
): EaCCloudWithResources {
  return EaCCloudWithResourcesSchema.parse(value);
}
