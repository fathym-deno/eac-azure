import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the base details structure for a Warm Query in Everything as Code (EaC).
 *
 * Warm queries are reusable or pre-computed payloads that can be invoked via reflex or trigger.
 */
export type EaCWarmQueryDetails = {
  /** Numeric version of this warm query (used for evolution or tracking). */
  Version?: number;

  /** Raw query body or expression to be pre-evaluated. */
  Query?: string;

  /** Section of the URL path that will serve as an additional lookup */
  ApiPath?: string;
} & EaCVertexDetails;

/**
 * Schema for validating `EaCWarmQueryDetails`.
 * Inherits metadata and vertex fields from `EaCVertexDetailsSchema`.
 */
export const EaCWarmQueryDetailsSchema: z.ZodType<EaCWarmQueryDetails> =
  EaCVertexDetailsSchema.extend({
    Version: z.number().optional().describe("Numeric version for this warm query."),
    Query: z.string().optional().describe("Precomputed query logic or raw body."),
    ApiPath: z.string().optional().describe("Section of the URL path that will serve as an additional lookup.")
  }).describe(
    "Schema for warm query configuration details in Everything-as-Code.",
  );

/**
 * Type guard for `EaCWarmQueryDetails`.
 */
export function isEaCWarmQueryDetails(
  value: unknown,
): value is EaCWarmQueryDetails {
  return EaCWarmQueryDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCWarmQueryDetails`.
 */
export function parseEaCWarmQueryDetails(value: unknown): EaCWarmQueryDetails {
  return EaCWarmQueryDetailsSchema.parse(value);
}
