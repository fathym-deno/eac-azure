import { EaCDetails, EaCDetailsSchema, z } from "./.deps.ts";
import { EaCCloudDetails, EaCCloudDetailsSchema } from "./EaCCloudDetails.ts";
import {
  EaCLandingZoneAsCode,
  EaCLandingZoneAsCodeSchema,
} from "./EaCLandingZoneAsCode.ts";
import {
  EaCCloudResourceGroupAsCode,
  EaCCloudResourceGroupAsCodeSchema,
} from "./EaCCloudResourceGroupAsCode.ts";
import {
  EaCCloudRoleAssignment,
  EaCCloudRoleAssignmentSchema,
} from "./EaCCloudRoleAssignment.ts";

/**
 * Represents a cloud configuration node in Everything-as-Code (EaC).
 * Includes landing zones, resource groups, and role assignments tied to a cloud provider.
 */
export type EaCCloudAsCode = {
  /** Optional record of provisioned landing zones. */
  LandingZones?: Record<string, EaCLandingZoneAsCode>;

  /** Optional record of scoped resource groups. */
  ResourceGroups?: Record<string, EaCCloudResourceGroupAsCode>;

  /** Optional role assignments within the cloud boundary. */
  RoleAssignments?: Record<string, EaCCloudRoleAssignment[]>;
} & EaCDetails<EaCCloudDetails>;

/**
 * Schema for `EaCCloudAsCode`.
 * Extends base metadata and cloud details, adding landing zones, resource groups, and role bindings.
 */
export const EaCCloudAsCodeSchema: z.ZodType<EaCCloudAsCode> = EaCDetailsSchema
  .extend({
    Details: EaCCloudDetailsSchema.optional(),
    LandingZones: z
      .record(EaCLandingZoneAsCodeSchema)
      .optional()
      .describe("Provisioned landing zones scoped by name or ID."),
    ResourceGroups: z
      .record(EaCCloudResourceGroupAsCodeSchema)
      .optional()
      .describe("Scoped cloud resource groups, keyed by identifier."),
    RoleAssignments: z
      .record(z.array(EaCCloudRoleAssignmentSchema))
      .optional()
      .describe("Role bindings for identity and permission management."),
  })
  .strip()
  .describe(
    "Schema for cloud configuration in Everything-as-Code (EaC), including deployment zones and access control.",
  );

/**
 * Type guard for `EaCCloudAsCode`.
 */
export function isEaCCloudAsCode(
  value: unknown,
): value is EaCCloudAsCode {
  return EaCCloudAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudAsCode`.
 */
export function parseEaCCloudAsCode(
  value: unknown,
): EaCCloudAsCode {
  return EaCCloudAsCodeSchema.parse(value);
}
