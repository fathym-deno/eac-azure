import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the base details structure for a Landing Zone in Everything-as-Code (EaC).
 *
 * Landing Zones define pre-structured cloud regions, resource policies, or deployment boundaries.
 * This model currently inherits only core vertex metadata.
 */
export type EaCLandingZoneDetails = EaCVertexDetails;

/**
 * Schema for validating `EaCLandingZoneDetails`.
 * Alias of `EaCVertexDetailsSchema`, wrapped for semantic clarity.
 */
export const EaCLandingZoneDetailsSchema: z.ZodType<EaCLandingZoneDetails> =
  EaCVertexDetailsSchema.describe(
    "Schema for landing zone configuration details in Everything-as-Code (EaC).",
  );

/**
 * Type guard for `EaCLandingZoneDetails`.
 */
export function isEaCLandingZoneDetails(
  value: unknown,
): value is EaCLandingZoneDetails {
  return EaCLandingZoneDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCLandingZoneDetails`.
 */
export function parseEaCLandingZoneDetails(
  value: unknown,
): EaCLandingZoneDetails {
  return EaCLandingZoneDetailsSchema.parse(value);
}
