import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the base details structure for a LaunchPad node in Everything-as-Code (EaC).
 *
 * LaunchPads typically serve as project entrypoints, pinned workflows, or system bootstraps.
 * This model currently inherits only core vertex metadata.
 */
export type EaCLaunchPadDetails = EaCVertexDetails;

/**
 * Schema for validating `EaCLaunchPadDetails`.
 * Alias of `EaCVertexDetailsSchema`, scoped for semantic traceability.
 */
export const EaCLaunchPadDetailsSchema: z.ZodType<EaCLaunchPadDetails> =
  EaCVertexDetailsSchema.describe(
    "Schema for launch pad node configuration in Everything-as-Code (EaC).",
  );

/**
 * Type guard for `EaCLaunchPadDetails`.
 */
export function isEaCLaunchPadDetails(
  value: unknown,
): value is EaCLaunchPadDetails {
  return EaCLaunchPadDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCLaunchPadDetails`.
 */
export function parseEaCLaunchPadDetails(
  value: unknown,
): EaCLaunchPadDetails {
  return EaCLaunchPadDetailsSchema.parse(value);
}
