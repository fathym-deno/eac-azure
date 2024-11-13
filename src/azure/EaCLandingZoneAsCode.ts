import { EaCDetails } from "./.deps.ts";
import { EaCLandingZoneDetails } from "./EaCLandingZoneDetails.ts";
import { EaCLaunchPadAsCode } from "./EaCLaunchPadAsCode.ts";

export type EaCLandingZoneAsCode = {
  LaunchPads?: Record<string, EaCLaunchPadAsCode>;
} & EaCDetails<EaCLandingZoneDetails>;
