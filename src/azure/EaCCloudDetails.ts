import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the base details structure for cloud providers in Everything-as-Code (EaC).
 * Concrete cloud types (e.g., Azure, AWS, GCP) should extend this with a fixed Type.
 */
export type EaCCloudDetails<TType extends string | undefined = string> = {
  Type: TType;
} & EaCVertexDetails;

/**
 * Base schema for `EaCCloudDetails`, expecting `Type` as a string.
 */
export const EaCCloudDetailsSchema: z.ZodObject<
  {
    Description: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
  } & {
    Type: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  EaCCloudDetails,
  EaCCloudDetails
> = EaCVertexDetailsSchema.extend({
  Type: z.string().describe("Cloud provider type (e.g., Azure, AWS, GCP)."),
}).describe("Schema for base cloud configuration details in EaC.");

/**
 * Type guard for `EaCCloudDetails<TType>`.
 */
export function isEaCCloudDetails<TType extends string | undefined = string>(
  type: TType,
  value: unknown,
): value is EaCCloudDetails<TType> {
  if (!EaCCloudDetailsSchema.safeParse(value).success) return false;
  return !type || (value as EaCCloudDetails<TType>).Type === type;
}

/**
 * Parses and validates a value as `EaCCloudDetails<TType>`.
 */
export function parseEaCCloudDetails<TType extends string | undefined = string>(
  value: unknown,
): EaCCloudDetails<TType> {
  return EaCCloudDetailsSchema.parse(value) as EaCCloudDetails<TType>;
}
