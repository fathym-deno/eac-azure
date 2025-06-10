// deno-lint-ignore-file no-explicit-any
import { EaCDetails, EaCDetailsSchema, z } from "./.deps.ts";
import {
  EaCCloudResourceDetails,
  EaCCloudResourceDetailsSchema,
} from "./EaCCloudResourceDetails.ts";
import {
  EaCCloudWithResources,
  EaCCloudWithResourcesSchema,
} from "./EaCCloudWithResources.ts";

/**
 * Represents a cloud resource in Everything-as-Code (EaC).
 * Combines typed resource details with optional nested resource definitions.
 */
export type EaCCloudResourceAsCode =
  & EaCCloudWithResources
  & EaCDetails<EaCCloudResourceDetails>;

/**
 * Schema for `EaCCloudResourceAsCode`.
 * Composes:
 *  - `EaCDetailsSchema` with narrowed `EaCCloudResourceDetailsSchema`
 *  - `EaCCloudWithResourcesSchema` for recursive resource maps
 */
export const EaCCloudResourceAsCodeSchema: z.ZodObject<
  {
    Resources: z.ZodOptional<z.ZodLazy<z.ZodRecord<z.ZodString, any>>>;
  } & {
    Details: z.ZodOptional<
      z.ZodObject<
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
      >
    >;
  },
  "strip",
  z.ZodTypeAny,
  EaCCloudResourceAsCode,
  EaCCloudResourceAsCode
> = EaCCloudWithResourcesSchema.extend({
  ...EaCDetailsSchema.shape,
  Details: EaCCloudResourceDetailsSchema.optional(),
})
  .strip()
  .describe(
    "Schema for cloud resource in Everything-as-Code (EaC), supporting typed details and recursive resource structures.",
  );

/**
 * Type guard for `EaCCloudResourceAsCode`.
 */
export function isEaCCloudResourceAsCode(
  value: unknown,
): value is EaCCloudResourceAsCode {
  return EaCCloudResourceAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudResourceAsCode`.
 */
export function parseEaCCloudResourceAsCode(
  value: unknown,
): EaCCloudResourceAsCode {
  return EaCCloudResourceAsCodeSchema.parse(value);
}
