import {
  AuthorizationManagementClient,
  delay,
  type EaCCloudRoleAssignment,
  type TokenCredential,
} from "../.deps.ts";
import { generateGuid } from "./utils.ts";

export async function ensureRoleAssignments(
  creds: TokenCredential,
  subId: string,
  roleAssigns: EaCCloudRoleAssignment[],
) {
  const client = new AuthorizationManagementClient(creds, subId);

  const roleAssignCalls = roleAssigns.map(async (roleAssign) => {
    const roleName = await generateGuid(
      roleAssign.Scope,
      roleAssign.PrincipalID,
      roleAssign.RoleDefinitionID,
    );

    try {
      await client.roleAssignments.get(roleAssign.Scope, roleName);
    } catch {
      await client.roleAssignments.create(roleAssign.Scope, roleName, {
        roleDefinitionId:
          `${roleAssign.Scope}/providers/Microsoft.Authorization/roleDefinitions/${roleAssign.RoleDefinitionID}`,
        principalId: roleAssign.PrincipalID,
        principalType: roleAssign.PrincipalType,
      });
    }
  });

  await Promise.all(roleAssignCalls);

  await delay(5000);
}
