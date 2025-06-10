import { z } from "./.deps.ts";

/**
 * Represents a record of service definitions in Everything-as-Code (EaC).
 * Each key maps to a service group with an array of supported types.
 */
export type EaCServiceDefinitions = Record<
  string,
  {
    /** List of supported types for the service. */
    Types: string[];
  }
>;

/**
 * Schema for a single service definition entry.
 */
export const EaCServiceDefinitionEntrySchema: z.ZodObject<
  {
    Types: z.ZodArray<z.ZodString, "many">;
  },
  "strip",
  z.ZodTypeAny,
  {
    Types: string[];
  },
  {
    Types: string[];
  }
> = z.object({
  Types: z
    .array(z.string())
    .describe("List of supported types for the service definition."),
});

/**
 * Schema for `EaCServiceDefinitions`.
 * Allows dynamic keys with structured value validation.
 */
export const EaCServiceDefinitionsSchema: z.ZodType<EaCServiceDefinitions> = z
  .record(EaCServiceDefinitionEntrySchema)
  .describe(
    "Schema for service definitions in Everything-as-Code (EaC), where each entry contains a list of supported types.",
  );

/**
 * Type guard for `EaCServiceDefinitions`.
 */
export function isEaCServiceDefinitions(
  value: unknown,
): value is EaCServiceDefinitions {
  return EaCServiceDefinitionsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCServiceDefinitions`.
 */
export function parseEaCServiceDefinitions(
  value: unknown,
): EaCServiceDefinitions {
  return EaCServiceDefinitionsSchema.parse(value);
}
