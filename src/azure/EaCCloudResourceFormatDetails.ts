import { z } from "./.deps.ts";
import {
  EaCCloudResourceDetails,
  EaCCloudResourceDetailsSchema,
} from "./EaCCloudResourceDetails.ts";

/**
 * Represents a `Format`-type cloud resource in Everything-as-Code (EaC).
 *
 * Format resources use templated content and parameters, often for IaC provisioning.
 */
export type EaCCloudResourceFormatDetails = EaCCloudResourceDetails & {
  /** Optional key-value pairs to inject as inputs to the format template. */
  Data?: Record<string, unknown>;

  /** Optional key-value pairs to extract outputs from the deployment result. */
  Outputs?: Record<string, string>;

  /** Template configuration for the format resource. */
  Template: {
    /** Raw content of the IaC template (e.g., Bicep, ARM, Terraform). */
    Content: string;

    /** JSON string representing parameter mappings for the template. */
    Parameters: string;
  };
};

/**
 * Schema for validating `EaCCloudResourceFormatDetails`.
 * Inherits order/type fields from `EaCCloudResourceDetailsSchema` and adds format-specific config.
 */
export const EaCCloudResourceFormatDetailsSchema: z.ZodType<
  EaCCloudResourceFormatDetails
> = EaCCloudResourceDetailsSchema.extend({
  Type: z.literal("Format"),
  Data: z
    .record(z.unknown())
    .optional()
    .describe("Optional input data passed to the format template."),
  Outputs: z
    .record(z.string())
    .optional()
    .describe("Optional output mappings from the format result."),
  Template: z
    .object({
      Content: z
        .string()
        .describe("The main IaC template content (e.g., Bicep, ARM)."),
      Parameters: z
        .string()
        .describe("JSON string defining template parameters."),
    })
    .describe("Template structure used for provisioning this format."),
}).describe(
  "Schema for Format-type cloud resource in Everything-as-Code (EaC).",
);

/**
 * Type guard for `EaCCloudResourceFormatDetails`.
 */
export function isEaCCloudResourceFormatDetails(
  value: unknown,
): value is EaCCloudResourceFormatDetails {
  return EaCCloudResourceFormatDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudResourceFormatDetails`.
 */
export function parseEaCCloudResourceFormatDetails(
  value: unknown,
): EaCCloudResourceFormatDetails {
  return EaCCloudResourceFormatDetailsSchema.parse(value);
}
