import { z } from "./.deps.ts";
import {
  EaCCloudResourceGroupDetails,
  EaCCloudResourceGroupDetailsSchema,
} from "./EaCCloudResourceGroupDetails.ts";
import {
  EaCCloudWithResources,
  EaCCloudWithResourcesSchema,
} from "./EaCCloudWithResources.ts";
import { EaCDetails, EaCDetailsSchema } from "./.deps.ts";

/**
 * Represents a cloud resource group in Everything-as-Code (EaC).
 * Combines typed group details with optional nested cloud resources.
 */
export type EaCCloudResourceGroupAsCode =
  & EaCCloudWithResources
  & EaCDetails<EaCCloudResourceGroupDetails>;

/**
 * Schema for `EaCCloudResourceGroupAsCode`.
 * Composes:
 *  - `EaCDetailsSchema` narrowed to `EaCCloudResourceGroupDetails`
 *  - `EaCCloudWithResourcesSchema` for recursive structure
 */
export const EaCCloudResourceGroupAsCodeSchema: z.ZodType<
  EaCCloudResourceGroupAsCode
> = EaCCloudWithResourcesSchema.extend({
  ...EaCDetailsSchema.shape,
  Details: EaCCloudResourceGroupDetailsSchema.optional(),
})
  .strip()
  .describe(
    "Schema for a cloud resource group in Everything-as-Code (EaC), supporting typed group metadata and nested resource definitions.",
  );

/**
 * Type guard for `EaCCloudResourceGroupAsCode`.
 */
export function isEaCCloudResourceGroupAsCode(
  value: unknown,
): value is EaCCloudResourceGroupAsCode {
  return EaCCloudResourceGroupAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudResourceGroupAsCode`.
 */
export function parseEaCCloudResourceGroupAsCode(
  value: unknown,
): EaCCloudResourceGroupAsCode {
  return EaCCloudResourceGroupAsCodeSchema.parse(value);
}
