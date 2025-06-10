import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the base details structure for a Secret in Everything-as-Code (EaC).
 *
 * Secrets may include direct values or references, and are typically injected at runtime.
 */
export type EaCSecretDetails = {
  /** Optional string value of the secret. */
  Value?: string;
} & EaCVertexDetails;

/**
 * Schema for validating `EaCSecretDetails`.
 * Inherits metadata and vertex fields from `EaCVertexDetailsSchema`.
 */
export const EaCSecretDetailsSchema: z.ZodType<EaCSecretDetails> =
  EaCVertexDetailsSchema.extend({
    Value: z.string().optional().describe(
      "Optional string value of the secret.",
    ),
  }).describe("Schema for secret configuration details in Everything-as-Code.");

/**
 * Type guard for `EaCSecretDetails`.
 */
export function isEaCSecretDetails(
  value: unknown,
): value is EaCSecretDetails {
  return EaCSecretDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCSecretDetails`.
 */
export function parseEaCSecretDetails(
  value: unknown,
): EaCSecretDetails {
  return EaCSecretDetailsSchema.parse(value);
}
