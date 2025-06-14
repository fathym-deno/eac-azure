import { z } from "./.deps.ts";
import type { EaCDetails } from "./.deps.ts";
import { EaCDetailsSchema } from "./.deps.ts";

import type { EaCCloudResourceDetails } from "./EaCCloudResourceDetails.ts";
import { EaCCloudResourceDetailsSchema } from "./EaCCloudResourceDetails.ts";

import {
  EaCCloudWithResources,
  EaCCloudWithResourcesSchema,
} from "./EaCCloudWithResources.ts";

/**
 * Represents a cloud resource in Everything-as-Code (EaC).
 * Combines typed resource details with optional nested resource definitions.
 */
export type EaCCloudResourceAsCode =
  & EaCCloudWithResources
  & EaCDetails<EaCCloudResourceDetails>;

/**
 * Schema for `EaCCloudResourceAsCode`.
 *
 * 1. Start from the generic-with-resources schema (loose Record<string, unknown>)
 * 2. Merge in EaCDetails + EaCCloudResourceDetails
 * 3. Override Resources with a true recursive definition
 */
export const EaCCloudResourceAsCodeSchema: z.ZodType<EaCCloudResourceAsCode> =
  // z;
  // .intersection(
  // EaCCloudWithResourcesSchema,
  z
    .object({
      // bring in all of the standard EaCDetails fields
      ...EaCDetailsSchema.shape,

      // our typed details about order & type
      Details: EaCCloudResourceDetailsSchema.optional(),

      // now replace the loose mapping with real recursion
      Resources: z
        .lazy(() => z.record(EaCCloudResourceAsCodeSchema))
        .optional()
        .describe("Optional mapping of nested cloud resources."),
    })
    // )
    .describe(
      "Schema for cloud resource in Everything-as-Code (EaC), supporting typed details and recursive resource structures.",
    );

/**
 * Type guard for `EaCCloudResourceAsCode`.
 */
export function isEaCCloudResourceAsCode(
  value: unknown,
): value is EaCCloudResourceAsCode {
  return EaCCloudResourceAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudResourceAsCode`.
 */
export function parseEaCCloudResourceAsCode(
  value: unknown,
): EaCCloudResourceAsCode {
  return EaCCloudResourceAsCodeSchema.parse(value);
}
