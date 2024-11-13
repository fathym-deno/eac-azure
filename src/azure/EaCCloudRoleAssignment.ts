export type EaCCloudRoleAssignment = {
  PrincipalID: string;

  PrincipalType: "User" | "Group" | "ServicePrincipal";

  RoleDefinitionID: string;

  Scope: string;
};
