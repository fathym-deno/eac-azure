import { EaCCloudResourceGroupDetails } from "./EaCCloudResourceGroupDetails.ts";
import { EaCCloudResourceAsCode } from "./EaCCloudResourceAsCode.ts";
import { EaCDetails } from "./.deps.ts";
import { EaCCloudWithResources } from "./EaCCloudWithResources.ts";

export type EaCCloudResourceGroupAsCode =
  & EaCCloudWithResources
  & EaCDetails<EaCCloudResourceGroupDetails>;
