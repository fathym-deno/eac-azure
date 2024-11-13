import { EaCDetails } from "./.deps.ts";
import { EaCLaunchPadDetails } from "./EaCLaunchPadDetails.ts";
import { EaCOverhaulAsCode } from "./EaCOverhaulAsCode.ts";

export type EaCLaunchPadAsCode = {
  Overhauls?: Record<string, EaCOverhaulAsCode>;
} & EaCDetails<EaCLaunchPadDetails>;
