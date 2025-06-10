import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the base details structure for a Cloud Resource Group in Everything-as-Code (EaC).
 *
 * Resource groups define location-scoped clusters of infrastructure. They may also
 * include sequencing logic (via `Order`) for controlled provisioning.
 */
export type EaCCloudResourceGroupDetails = {
  /** Optional physical or logical location of the resource group (e.g., Azure region). */
  Location?: string;

  /** Optional execution or creation order for staged deployment. */
  Order?: number;
} & EaCVertexDetails;

/**
 * Schema for validating `EaCCloudResourceGroupDetails`.
 * Extends the core vertex schema with cloud-specific properties.
 */
export const EaCCloudResourceGroupDetailsSchema: z.ZodType<
  EaCCloudResourceGroupDetails
> = EaCVertexDetailsSchema.extend({
  Location: z
    .string()
    .optional()
    .describe("Cloud region or physical location for the resource group."),
  Order: z
    .number()
    .optional()
    .describe("Optional sequence order for staged provisioning."),
}).describe(
  "Schema for resource group configuration details in Everything-as-Code (EaC).",
);

/**
 * Type guard for `EaCCloudResourceGroupDetails`.
 */
export function isEaCCloudResourceGroupDetails(
  value: unknown,
): value is EaCCloudResourceGroupDetails {
  return EaCCloudResourceGroupDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudResourceGroupDetails`.
 */
export function parseEaCCloudResourceGroupDetails(
  value: unknown,
): EaCCloudResourceGroupDetails {
  return EaCCloudResourceGroupDetailsSchema.parse(value);
}
