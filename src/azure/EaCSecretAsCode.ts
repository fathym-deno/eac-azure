import { EaCDetails, EaCDetailsSchema, z } from "./.deps.ts";
import {
  EaCSecretDetails,
  EaCSecretDetailsSchema,
} from "./EaCSecretDetails.ts";

/**
 * Represents a secret configuration in Everything-as-Code (EaC).
 * Includes secret-specific details and optional cloud or vault bindings.
 */
export type EaCSecretAsCode = {
  CloudLookup?: string;

  KeyVaultLookup?: string;
} & EaCDetails<EaCSecretDetails>;

/**
 * Schema for `EaCSecretAsCode`.
 * Replaces `Details` from base `EaCDetailsSchema` with a narrowed secret schema,
 * and adds cloud and vault lookups.
 */
export const EaCSecretAsCodeSchema: z.ZodObject<
  {} & {
    Details: z.ZodOptional<
      z.ZodType<EaCSecretDetails, z.ZodTypeDef, EaCSecretDetails>
    >;
    CloudLookup: z.ZodOptional<z.ZodString>;
    KeyVaultLookup: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  EaCSecretAsCode,
  EaCSecretAsCode
> = EaCDetailsSchema.extend({
  Details: EaCSecretDetailsSchema.optional(),
  CloudLookup: z.string().optional(),
  KeyVaultLookup: z.string().optional(),
})
  .strip()
  .describe("Schema for secret configuration in Everything-as-Code (EaC).");

/**
 * Type guard for `EaCSecretAsCode`.
 */
export function isEaCSecretAsCode(value: unknown): value is EaCSecretAsCode {
  return EaCSecretAsCodeSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCSecretAsCode`.
 */
export function parseEaCSecretAsCode(value: unknown): EaCSecretAsCode {
  return EaCSecretAsCodeSchema.parse(value);
}
