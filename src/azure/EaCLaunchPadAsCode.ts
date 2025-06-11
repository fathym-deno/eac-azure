import { EaCDetails, EaCDetailsSchema, z } from "./.deps.ts";
import {
  EaCLaunchPadDetails,
  EaCLaunchPadDetailsSchema,
} from "./EaCLaunchPadDetails.ts";
import {
  EaCOverhaulAsCode,
  EaCOverhaulAsCodeSchema,
} from "./EaCOverhaulAsCode.ts";

/**
 * Represents a LaunchPad configuration in Everything-as-Code (EaC).
 * LaunchPads may include Overhaul plans as child nodes, along with launch metadata.
 */
export type EaCLaunchPadAsCode = {
  /** Optional mapping of named Overhaul plans under this LaunchPad. */
  Overhauls?: Record<string, EaCOverhaulAsCode>;
} & EaCDetails<EaCLaunchPadDetails>;

/**
 * Schema for `EaCLaunchPadAsCode`.
 * Extends the base `EaCDetailsSchema` with LaunchPad-specific fields and nested overhauls.
 */
export const EaCLaunchPadAsCodeSchema: z.ZodType<EaCLaunchPadAsCode> =
  EaCDetailsSchema.extend({
    Details: EaCLaunchPadDetailsSchema.optional(),
    Overhauls: z
      .record(EaCOverhaulAsCodeSchema)
      .optional()
      .describe("Optional mapping of Overhaul plans under this LaunchPad."),
  })
    .strip()
    .describe(
      "Schema for launch pad configuration in Everything-as-Code (EaC), including optional nested Overhauls.",
    );

/**
 * Type guard for `EaCLaunchPadAsCode`.
 */
export function isEaCLaunchPadAsCode(
  value: unknown,
): value is EaCLaunchPadAsCode {
  return EaCLaunchPadAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCLaunchPadAsCode`.
 */
export function parseEaCLaunchPadAsCode(
  value: unknown,
): EaCLaunchPadAsCode {
  return EaCLaunchPadAsCodeSchema.parse(value);
}
