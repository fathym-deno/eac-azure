import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the base details structure for an Overhaul node in Everything-as-Code (EaC).
 *
 * This structure is metadata-only and inherits all fields from the generic vertex model.
 */
export type EaCOverhaulDetails = EaCVertexDetails;

/**
 * Schema for validating `EaCOverhaulDetails`.
 * This is a passthrough of `EaCVertexDetailsSchema` for semantic parity.
 */
export const EaCOverhaulDetailsSchema: z.ZodType<EaCOverhaulDetails> =
  EaCVertexDetailsSchema.describe(
    "Schema for overhaul node configuration in Everything-as-Code (EaC).",
  );

/**
 * Type guard for `EaCOverhaulDetails`.
 */
export function isEaCOverhaulDetails(
  value: unknown,
): value is EaCOverhaulDetails {
  return EaCOverhaulDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCOverhaulDetails`.
 */
export function parseEaCOverhaulDetails(
  value: unknown,
): EaCOverhaulDetails {
  return EaCOverhaulDetailsSchema.parse(value);
}
