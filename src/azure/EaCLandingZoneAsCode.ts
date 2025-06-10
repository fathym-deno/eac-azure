import { EaCDetails, EaCDetailsSchema, z } from "./.deps.ts";
import {
  EaCLandingZoneDetails,
  EaCLandingZoneDetailsSchema,
} from "./EaCLandingZoneDetails.ts";
import {
  EaCLaunchPadAsCode,
  EaCLaunchPadAsCodeSchema,
} from "./EaCLaunchPadAsCode.ts";

/**
 * Represents a Landing Zone configuration in Everything-as-Code (EaC).
 * Landing Zones define cloud-rooted boundaries and may contain LaunchPads.
 */
export type EaCLandingZoneAsCode = {
  /** Optional collection of LaunchPads within this Landing Zone. */
  LaunchPads?: Record<string, EaCLaunchPadAsCode>;
} & EaCDetails<EaCLandingZoneDetails>;

/**
 * Schema for `EaCLandingZoneAsCode`.
 * Extends the base `EaCDetailsSchema` with `EaCLandingZoneDetailsSchema`
 * and an optional map of nested LaunchPads.
 */
export const EaCLandingZoneAsCodeSchema: z.ZodType<EaCLandingZoneAsCode> =
  EaCDetailsSchema.extend({
    Details: EaCLandingZoneDetailsSchema.optional(),
    LaunchPads: z
      .record(EaCLaunchPadAsCodeSchema)
      .optional()
      .describe("Optional map of LaunchPads defined under this Landing Zone."),
  })
    .strip()
    .describe(
      "Schema for landing zone configuration in Everything-as-Code (EaC), including optional LaunchPads.",
    );

/**
 * Type guard for `EaCLandingZoneAsCode`.
 */
export function isEaCLandingZoneAsCode(
  value: unknown,
): value is EaCLandingZoneAsCode {
  return EaCLandingZoneAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCLandingZoneAsCode`.
 */
export function parseEaCLandingZoneAsCode(
  value: unknown,
): EaCLandingZoneAsCode {
  return EaCLandingZoneAsCodeSchema.parse(value);
}
