import {
  type AccessToken,
  type Application,
  djwt,
  type EaCCloudAsCode,
  type EaCCloudAzureDetails,
  GraphClient,
  type Logger,
  type PasswordCredential,
  type ServicePrincipal,
  SubscriptionClient,
  type TokenCredential,
} from "../.deps.ts";
import {
  loadAzureCloudCredentials,
  loadMainAzureCredentials,
} from "../loadAzureCloudCredentials.ts";
import { TokenProvider } from "./token-provider.ts";
import { ensureRoleAssignments } from "./role-assignments.ts";
import { mapGraphPermissionError } from "./graph-permissions.ts";

export async function finalizeCloudDetails(
  logger: Logger,
  entLookup: string,
  cloudLookup: string,
  commitId: string,
  cloud: EaCCloudAsCode,
): Promise<void> {
  if (!cloud.Details) {
    cloud.Token = "";
    return;
  }

  logger.debug(`Finalizing EaC commit ${commitId} Cloud details`);

  const details = cloud.Details as EaCCloudAzureDetails;

  const usingUserToken = Boolean(cloud.Token);
  const userToken = usingUserToken ? (cloud.Token as string) : undefined;

  const managedCredential = loadMainAzureCredentials();

  const resourceCredential = usingUserToken
    ? await loadAzureCloudCredentials(cloud)
    : managedCredential;

  // Always use managed app credential for Graph to avoid Invalid audience when user token is for ARM
  let graphCredential: TokenCredential = managedCredential;

  if (usingUserToken && userToken) {
    try {
      const payloadPart = userToken.split(".")[1];
      const payload = JSON.parse(
        atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")),
      ) as { aud?: string; scp?: string; roles?: string[] };
      logger.debug(
        `Cloud finalize using user-provided token; aud=${
          payload.aud ?? "unknown"
        } scp=${payload.scp ?? ""} roles=${(payload.roles ?? []).join(",")}`,
      );
      logger.debug(
        `Proceeding to use managed application credential for Microsoft Graph operations`,
      );
    } catch {
      logger.debug(
        `Cloud finalize received a user token; unable to decode audience for diagnostics. Using managed app credential for Graph operations.`,
      );
    }
  }

  const graphClient = GraphClient.initWithMiddleware({
    authProvider: new TokenProvider(graphCredential, {
      scopes: [`https://graph.microsoft.com/.default`],
    }),
  });

  const subClient = new SubscriptionClient(resourceCredential);

  try {
    let tokenPayload: Record<string, unknown> | undefined;

    if (usingUserToken && userToken) {
      const [_, payload] = await djwt.decode(userToken);
      tokenPayload = payload as Record<string, unknown>;
      if (!details.TenantID && tokenPayload?.tid) {
        details.TenantID = tokenPayload.tid as string;
      }
    } else if (!usingUserToken && !details.TenantID) {
      const managedTenantId = Deno.env.get("AZURE_TENANT_ID");
      if (managedTenantId) {
        details.TenantID = managedTenantId;
      }
    }

    if (!details.SubscriptionID && details.BillingScope) {
      const aliasProperties: Record<string, unknown> = {
        displayName: (details.Name as string) ?? `Managed ${cloudLookup}`,
        workload: details.IsDev ? "DevTest" : "Production",
        billingScope: details.BillingScope as string,
      };

      const aliasAdditional: Record<string, unknown> = {};

      if (details.TenantID) {
        aliasAdditional.subscriptionTenantId = details.TenantID;
      }

      const managedOwnerId = Deno.env.get(
        "AZURE_MANAGED_SUBSCRIPTION_OWNER_ID",
      );
      const ownerId = usingUserToken
        ? (tokenPayload as Record<string, unknown> | undefined)?.oid
        : managedOwnerId;

      if (ownerId) {
        aliasAdditional.subscriptionOwnerId = ownerId;
      }

      if (Object.keys(aliasAdditional).length) {
        aliasProperties.additionalProperties = aliasAdditional;
      }

      const createResp = await subClient.alias.beginCreateAndWait(
        crypto.randomUUID(),
        { properties: aliasProperties },
      );

      details.SubscriptionID = createResp.properties?.subscriptionId!;

      delete (details as Record<string, unknown>).AgreementType;
      delete (details as Record<string, unknown>).BillingScope;
      delete (details as Record<string, unknown>).IsDev;
    }

    if (details.SubscriptionID && !details.Name) {
      const sub = await subClient.subscriptions.get(details.SubscriptionID);
      details.Name = sub.displayName;
      details.Description ??= sub.displayName;
    }

    if (details.SubscriptionID && details.TenantID && !details.ApplicationID) {
      const appName =
        `eac|${details.SubscriptionID}|${entLookup}|${cloudLookup}`;

      const appRes: { value: Application[] } = await graphClient
        .api("/applications")
        .filter(`displayName eq '${appName}'`)
        .get();

      let app = appRes.value[0];
      if (!app) {
        app = {
          displayName: appName,
          description: details.Description,
        } as Application;
      }
      app = await graphClient.api("/applications").post(app);
      details.ApplicationID = app.appId!;
    }

    if (
      details.SubscriptionID && details.TenantID && details.ApplicationID &&
      !details.AuthKey
    ) {
      const appName =
        `eac|${details.SubscriptionID}|${entLookup}|${cloudLookup}`;

      const spRes: { value: ServicePrincipal[] } = await graphClient
        .api("/servicePrincipals")
        .filter(`appId eq '${details.ApplicationID}'`)
        .filter(`displayName eq '${appName}'`)
        .get();

      let svcPrincipal = spRes.value[0];
      if (!svcPrincipal) {
        svcPrincipal = {
          appId: details.ApplicationID,
          displayName: appName,
          description: details.Description,
        } as unknown as ServicePrincipal;
      }
      svcPrincipal = await graphClient.api("/servicePrincipals").post(
        svcPrincipal,
      );
      details.ID = svcPrincipal.id!;

      const spPassword: PasswordCredential = await graphClient
        .api(`/servicePrincipals/${details.ID}/addPassword`)
        .post(
          { displayName: `${details.Name} Password` } as PasswordCredential,
        );
      details.AuthKey = spPassword.secretText!;

      const scope = `/subscriptions/${details.SubscriptionID}`;
      await ensureRoleAssignments(resourceCredential, details.SubscriptionID, [
        {
          Scope: scope,
          PrincipalID: details.ID!,
          PrincipalType: "ServicePrincipal",
          RoleDefinitionID: "8e3af657-a8ff-443c-a75c-2fe8c4bcb635",
        },
      ]);
    }

    if (!details.ID && details.ApplicationID) {
      const svcPrinc = await graphClient
        .api("/servicePrincipals")
        .filter(`appId eq '${details.ApplicationID}'`)
        .select(["id"])
        .get() as { value: { id: string }[] };
      details.ID = svcPrinc.value[0].id;
    }
  } catch (err) {
    if (usingUserToken) {
      const permissionError = mapGraphPermissionError(err);
      if (permissionError) {
        throw permissionError;
      }
    }
    throw err;
  }

  cloud.Token = "";
}
