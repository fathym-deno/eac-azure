import { z } from "./.deps.ts";
import { EaCCloudDetails, EaCCloudDetailsSchema } from "./EaCCloudDetails.ts";

/**
 * Azure-specific extension of `EaCCloudDetails` with required credentials and metadata.
 */
export type EaCCloudAzureDetails = EaCCloudDetails<"Azure"> & {
  ApplicationID: string;
  AuthKey: string;
  ID?: string;
  SubscriptionID: string;
  TenantID: string;
};

/**
 * Schema for `EaCCloudAzureDetails`, extending base cloud schema with Azure credentials.
 */
export const EaCCloudAzureDetailsSchema: z.ZodType<EaCCloudAzureDetails> =
  EaCCloudDetailsSchema.extend({
    Type: z.literal("Azure"),
    ApplicationID: z.string().describe("Client ID for Azure app registration."),
    AuthKey: z.string().describe(
      "Client secret or key for Azure authentication.",
    ),
    ID: z.string().optional().describe("Optional alias or external ID."),
    SubscriptionID: z.string().describe("Azure subscription identifier."),
    TenantID: z.string().describe("Azure tenant (directory) identifier."),
  }).describe(
    "Schema for Azure-specific cloud provider configuration.",
  ) as unknown as z.ZodType<EaCCloudAzureDetails>;

/**
 * Type guard for `EaCCloudAzureDetails`.
 */
export function isEaCCloudAzureDetails(
  value: unknown,
): value is EaCCloudAzureDetails {
  return EaCCloudAzureDetailsSchema.safeParse(value).success;
}

/**
 * Parses and validates a value as `EaCCloudAzureDetails`.
 */
export function parseEaCCloudAzureDetails(
  value: unknown,
): EaCCloudAzureDetails {
  return EaCCloudAzureDetailsSchema.parse(value);
}
