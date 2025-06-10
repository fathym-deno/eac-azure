import { z } from "./.deps.ts";

/**
 * Represents a cloud role assignment in Everything-as-Code (EaC).
 * Maps a principal to a role definition within a given scope.
 */
export type EaCCloudRoleAssignment = {
  /** Unique ID of the principal (e.g., user, group, or service principal). */
  PrincipalID: string;

  /** Type of the principal. */
  PrincipalType: "User" | "Group" | "ServicePrincipal";

  /** ID of the role definition being assigned. */
  RoleDefinitionID: string;

  /** Scope of the role assignment (e.g., subscription, resource group). */
  Scope: string;
};

/**
 * Schema for validating `EaCCloudRoleAssignment`.
 */
export const EaCCloudRoleAssignmentSchema: z.ZodType<EaCCloudRoleAssignment> = z
  .object({
    PrincipalID: z
      .string()
      .describe(
        "Unique ID of the principal (user, group, or service principal).",
      ),
    PrincipalType: z
      .enum(["User", "Group", "ServicePrincipal"])
      .describe("Type of the principal being assigned the role."),
    RoleDefinitionID: z
      .string()
      .describe("Identifier for the role definition."),
    Scope: z
      .string()
      .describe("Scope at which the role assignment applies."),
  })
  .describe("Schema for cloud role assignment in Everything-as-Code (EaC).");

/**
 * Type guard for `EaCCloudRoleAssignment`.
 */
export function isEaCCloudRoleAssignment(
  value: unknown,
): value is EaCCloudRoleAssignment {
  return EaCCloudRoleAssignmentSchema.safeParse(value).success;
}

/**
 * Validates and parses an object as `EaCCloudRoleAssignment`.
 */
export function parseEaCCloudRoleAssignment(
  value: unknown,
): EaCCloudRoleAssignment {
  return EaCCloudRoleAssignmentSchema.parse(value);
}
