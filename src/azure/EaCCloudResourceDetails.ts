import { EaCVertexDetails, EaCVertexDetailsSchema, z } from "./.deps.ts";

/**
 * Represents the details of a Cloud Resource in Everything-as-Code (EaC).
 *
 * Resources are typed units like formats or containers, and are ordered for provisioning logic.
 */
export type EaCCloudResourceDetails = {
  /** Execution or provisioning order for this resource within its group or zone. */
  Order: number;

  /** The type of the cloud resource (e.g., Format or Container). */
  Type: "Format" | "Container";
} & EaCVertexDetails;

/**
 * Schema for validating `EaCCloudResourceDetails`.
 * Inherits metadata from `EaCVertexDetailsSchema` and adds resource-specific fields.
 */
export const EaCCloudResourceDetailsSchema: z.ZodObject<
  {
    Description: z.ZodOptional<z.ZodString>;
    Name: z.ZodOptional<z.ZodString>;
  } & {
    Order: z.ZodNumber;
    Type: z.ZodEnum<["Format", "Container"]>;
  },
  "strip",
  z.ZodTypeAny,
  EaCCloudResourceDetails,
  EaCCloudResourceDetails
> = EaCVertexDetailsSchema.extend({
  Order: z
    .number()
    .describe("Execution or provisioning order for the cloud resource."),
  Type: z
    .enum(["Format", "Container"])
    .describe("The type of the cloud resource: Format or Container."),
}).describe(
  "Schema for cloud resource configuration details in Everything-as-Code (EaC).",
);

/**
 * Type guard for `EaCCloudResourceDetails`.
 */
export function isEaCCloudResourceDetails(
  value: unknown,
): value is EaCCloudResourceDetails {
  return EaCCloudResourceDetailsSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudResourceDetails`.
 */
export function parseEaCCloudResourceDetails(
  value: unknown,
): EaCCloudResourceDetails {
  return EaCCloudResourceDetailsSchema.parse(value);
}
