import { EaCCloudDetails, isEaCCloudDetails } from "./EaCCloudDetails.ts";
import { EaCLandingZoneAsCode } from "./EaCLandingZoneAsCode.ts";
import { EaCCloudResourceGroupAsCode } from "./EaCCloudResourceGroupAsCode.ts";
import { EaCDetails } from "./.deps.ts";
import { EaCCloudRoleAssignment } from "./EaCCloudRoleAssignment.ts";

export type EaCCloudAsCode = {
  LandingZones?: Record<string, EaCLandingZoneAsCode>;

  ResourceGroups?: Record<string, EaCCloudResourceGroupAsCode>;

  RoleAssignments?: Record<string, EaCCloudRoleAssignment[]>;
} & EaCDetails<EaCCloudDetails>;

export function isEaCCloudAsCode(eac: unknown): eac is EaCCloudAsCode {
  const cloud = eac as EaCCloudAsCode;

  return (
    cloud && cloud.Details !== undefined && isEaCCloudDetails(cloud.Details)
  );
}
