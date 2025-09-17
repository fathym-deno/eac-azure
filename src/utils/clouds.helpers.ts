// deno-lint-ignore-file no-explicit-any

import {
  AccessToken,
  Application,
  AuthenticationProvider,
  AuthenticationProviderOptions,
  AuthorizationManagementClient,
  delay,
  Deployment,
  DeploymentExtended,
  djwt,
  EaCActuatorCheckRequest,
  EaCCloudAsCode,
  EaCCloudAzureDetails,
  EaCCloudDeployment,
  EaCCloudResourceAsCode,
  EaCCloudResourceFormatDetails,
  EaCCloudResourceGroupAsCode,
  EaCCloudResourceGroupDetails,
  EaCCloudRoleAssignment,
  EverythingAsCodeClouds,
  GenericResourceExpanded,
  GraphClient,
  Handlebars,
  Logger,
  merge,
  PasswordCredential,
  ResourceManagementClient,
  ServicePrincipal,
  SubscriptionClient,
  TokenCredential,
} from "./.deps.ts";
import {
  loadAzureCloudCredentials,
  loadMainAzureCredentials,
} from "./loadAzureCloudCredentials.ts";
import { loadResoureTypeApiVersions } from "./loadResoureTypeApiVersions.ts";

export class TokenProvider implements AuthenticationProvider {
  constructor(
    protected credential: TokenCredential,
    protected authenticationProviderOptions: AuthenticationProviderOptions,
  ) {}

  public async getAccessToken(): Promise<string> {
    const scopes = this.authenticationProviderOptions?.scopes ?? [
      `https://graph.microsoft.com/.default`,
    ];

    const accessToken = await this.credential.getToken(scopes);

    if (!accessToken?.token) {
      throw new Error(
        "Failed to acquire Microsoft Graph access token with the provided credential.",
      );
    }

    return accessToken.token;
  }
}

const REQUIRED_GRAPH_PERMISSIONS = [
  "Application.ReadWrite.All",
];

const REQUIRED_AZURE_AD_ROLES = [
  "Application Administrator",
  "Cloud Application Administrator",
];

export class GraphPermissionError extends Error {
  public readonly requiredPermissions: string[];
  public readonly requiredDirectoryRoles: string[];
  public readonly graphError?: {
    code?: string;
    message?: string;
    statusCode?: number;
  };

  constructor(
    message: string,
    requiredPermissions: string[],
    requiredDirectoryRoles: string[],
    graphError?: { code?: string; message?: string; statusCode?: number },
  ) {
    super(message);
    this.name = "GraphPermissionError";
    this.requiredPermissions = requiredPermissions;
    this.requiredDirectoryRoles = requiredDirectoryRoles;
    this.graphError = graphError;
  }
}

export function mapGraphPermissionError(err: unknown):
  | GraphPermissionError
  | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }

  const maybeError = err as {
    statusCode?: number;
    code?: string;
    message?: string;
    error?: { code?: string; message?: string };
    body?: { error?: { code?: string; message?: string } };
  };

  const statusCode = typeof maybeError.statusCode === "number"
    ? maybeError.statusCode
    : undefined;

  const code = maybeError.code ??
    maybeError.error?.code ??
    maybeError.body?.error?.code;

  const message = maybeError.message ??
    maybeError.error?.message ??
    maybeError.body?.error?.message;

  const normalizedMessage = typeof message === "string" ? message : undefined;
  const normalizedCode = typeof code === "string"
    ? code.toLowerCase()
    : undefined;

  const insufficient = statusCode === 403 ||
    normalizedCode === "authorization_requestdenied" ||
    normalizedCode === "authentication_requestdenied" ||
    normalizedCode === "accessdenied" ||
    normalizedCode === "forbidden" ||
    (normalizedMessage &&
      normalizedMessage.toLowerCase().includes("insufficient privileges"));

  if (!insufficient) {
    return undefined;
  }

  return new GraphPermissionError(
    "Insufficient Microsoft Graph permissions to configure the Azure cloud.",
    REQUIRED_GRAPH_PERMISSIONS,
    REQUIRED_AZURE_AD_ROLES,
    {
      code,
      message: normalizedMessage,
      statusCode,
    },
  );
}

export async function getCurrentAzureUser(accessToken: string): Promise<any> {
  // const creds = loadAzureCloudCredentials(cloud);
  // const creds = loadMainAzureCredentials();

  const graphClient = GraphClient.initWithMiddleware({
    authProvider: new TokenProvider(
      {
        getToken: (_scopes) => {
          return Promise.resolve({
            token: accessToken,
            expiresOnTimestamp: Date.now() + 5 * 60 * 1000,
          } as AccessToken);
        },
      } as TokenCredential,
      {
        scopes: [`https://graph.microsoft.com/.default`], //"Application.Read.All"],
      },
    ),
  });

  const me = await graphClient
    .api("/me")
    // .select(["id"])
    .get();

  return me;
}

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

  const graphCredential: TokenCredential = usingUserToken
    ? {
      getToken: (_scopes) =>
        Promise.resolve({
          token: userToken!,
          expiresOnTimestamp: Date.now() + 5 * 60 * 1000,
        } as AccessToken),
    } as TokenCredential
    : managedCredential;

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
        {
          properties: aliasProperties,
        },
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

    if (
      details.SubscriptionID &&
      details.TenantID &&
      !details.ApplicationID
    ) {
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
        };
      }

      app = await graphClient.api("/applications").post(app);

      details.ApplicationID = app.appId!;
    }

    if (
      details.SubscriptionID &&
      details.TenantID &&
      details.ApplicationID &&
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
        };
      }

      svcPrincipal = await graphClient
        .api("/servicePrincipals")
        .post(svcPrincipal);

      details.ID = svcPrincipal.id!;

      const spPassword: PasswordCredential = await graphClient
        .api(`/servicePrincipals/${details.ID}/addPassword`)
        .post({
          displayName: `${details.Name} Password`,
        } as PasswordCredential);

      details.AuthKey = spPassword.secretText!;

      const scope = `/subscriptions/${details.SubscriptionID}`;

      await ensureRoleAssignments(resourceCredential, details.SubscriptionID, [
        {
          Scope: scope,
          PrincipalID: details.ID,
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
        .get();

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

export async function ensureRoleAssignments(
  creds: TokenCredential,
  subId: string,
  roleAssigns: EaCCloudRoleAssignment[],
) {
  const client = new AuthorizationManagementClient(creds, subId);

  const roleAssignCalls = roleAssigns.map(async (roleAssign) => {
    const roleName = await generateGuid(
      subId,
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

export async function generateGuid(...input: any[]): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(input));

  // Calculate SHA-256 hash of the input
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  // GUID format: 8-4-4-4-12 (32 characters)
  const guid = [
    hashHex.substring(0, 8),
    hashHex.substring(8, 12),
    hashHex.substring(12, 16),
    hashHex.substring(16, 20),
    hashHex.substring(20, 32),
  ].join("-");

  return guid;
}

export async function buildCloudDeployments(
  logger: Logger,
  commitId: string,
  eac: EverythingAsCodeClouds,
  cloudLookup: string,
  cloud: EaCCloudAsCode,
): Promise<EaCCloudDeployment[]> {
  logger.debug(`Building EaC commit ${commitId} Cloud deloyments`);

  const resGroupLookups = Object.keys(cloud.ResourceGroups || {});

  const deployments: EaCCloudDeployment[] = [];

  for (const resGroupLookup of resGroupLookups) {
    const resGroup = cloud.ResourceGroups![resGroupLookup];

    const deployment = await buildCloudDeployment(
      logger,
      commitId,
      eac,
      cloudLookup,
      resGroupLookup,
      resGroup,
    );

    if (deployment) {
      deployments.push(deployment);
    }
  }

  return deployments;
}

export async function buildCloudDeployment(
  logger: Logger,
  commitId: string,
  eac: EverythingAsCodeClouds,
  cloudLookup: string,
  resGroupLookup: string,
  resGroup: EaCCloudResourceGroupAsCode,
): Promise<EaCCloudDeployment | undefined> {
  if (Object.keys(resGroup.Resources || {}).length > 0) {
    logger.debug(
      `Building EaC commit ${commitId} Cloud deployment for ${resGroupLookup}`,
    );

    const resGroupTemplateResources: Record<string, unknown>[] = [];

    const useResGroupDetails = resGroup.Details ||
      eac.Clouds![cloudLookup].ResourceGroups![resGroupLookup].Details;

    const armResources = await buildArmResourcesForResourceGroupDeployment(
      useResGroupDetails!,
      cloudLookup,
      resGroupLookup,
      resGroup,
    );

    resGroupTemplateResources.push(...armResources);

    const deploymentName = `resource-group-${resGroupLookup}-${Date.now()}`;

    const deployment: Deployment = {
      location: useResGroupDetails!.Location,
      properties: {
        mode: "Incremental",
        expressionEvaluationOptions: {
          scope: "outer",
        },
        template: {
          $schema:
            "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
          contentVersion: "1.0.0.0",
          resources: resGroupTemplateResources,
        },
      },
      tags: {
        Cloud: cloudLookup,
      },
    };

    return {
      CloudLookup: cloudLookup,
      Deployment: deployment,
      Name: deploymentName,
      ResourceGroupLookup: resGroupLookup,
    };
  }

  return undefined;
}

export async function buildArmResourcesForResourceGroupDeployment(
  useResGroupDetails: EaCCloudResourceGroupDetails,
  cloudLookup: string,
  resGroupLookup: string,
  resGroup: EaCCloudResourceGroupAsCode,
): Promise<Record<string, unknown>[]> {
  const armResources: Record<string, unknown>[] = [];

  armResources.push({
    type: "Microsoft.Resources/resourceGroups",
    apiVersion: "2018-05-01",
    name: resGroupLookup,
    location: useResGroupDetails.Location,
    tags: {
      Cloud: cloudLookup,
    },
  });

  const resourceArmResources = await buildArmResourcesForResources(
    cloudLookup,
    resGroupLookup,
    resGroup.Resources || {},
    [`[resourceId('Microsoft.Resources/resourceGroups', '${resGroupLookup}')]`],
  );

  armResources.push(...resourceArmResources);

  return armResources;
}

export async function buildArmResourcesForResources(
  cloudLookup: string,
  resGroupLookup: string,
  resources: Record<string, EaCCloudResourceAsCode>,
  dependsOn: string[],
): Promise<Record<string, unknown>[]> {
  const resLookups = Object.keys(resources);

  const armResources: Record<string, unknown>[] = [];

  for (const resLookup of resLookups) {
    const resource = resources[resLookup];

    const resArmResource = await buildResourceTemplateResource(
      cloudLookup,
      resGroupLookup,
      resLookup,
      resource,
      dependsOn,
    );

    armResources.push(resArmResource);
  }

  return armResources;
}

export async function buildResourceTemplateResource(
  cloudLookup: string,
  resGroupLookup: string,
  resLookup: string,
  resource: EaCCloudResourceAsCode,
  dependsOn: string[],
): Promise<Record<string, unknown>> {
  const details = resource.Details as EaCCloudResourceFormatDetails;

  const assets = await loadCloudResourceDetailAssets(details);

  const deploymentName = `resource-${resLookup}-${Date.now()}`;

  const armResource = {
    type: "Microsoft.Resources/deployments",
    apiVersion: "2019-10-01",
    dependsOn: dependsOn,
    resourceGroup: resGroupLookup,
    name: deploymentName,
    properties: {
      mode: "Incremental",
      expressionEvaluationOptions: {
        scope: "inner",
      },
      parameters: formatParameters(details.Data || {}, assets.Parameters),
      template: {
        ...assets.Content,
      },
    },
    tags: {
      Cloud: cloudLookup,
    },
  };

  const peerResources = armResource.properties.template.resources as Record<
    string,
    unknown
  >[];

  if (resource.Resources) {
    const subResArmResources = await buildArmResourcesForResources(
      cloudLookup,
      resGroupLookup,
      resource.Resources || {},
      peerResources.map((pr) => {
        let name = pr.name as string;

        if (name.startsWith("[")) {
          name = name.substring(1, name.length - 1);
        } else {
          name = `'${name}'`;
        }

        return `[resourceId('${pr.type}', ${name})]`;
      }),
      // [
      //   // `[resourceId('Microsoft.Resources/resourceGroups', '${resGroupLookup}')]`,
      //   // `[resourceId('Microsoft.Resources/deployments', '${deploymentName}')]`,
      // ],
    );

    peerResources.push(...subResArmResources);
  }

  return armResource;
}

export async function loadCloudResourceDetailAssets(
  details: EaCCloudResourceFormatDetails,
): Promise<{
  Content: Record<string, unknown>;
  Parameters: Record<string, unknown>;
}> {
  const assetPaths = [
    { Lookup: "Content", Path: details.Template.Content },
    { Lookup: "Parameters", Path: details.Template.Parameters },
  ];

  const assetCalls = assetPaths.map(async (asset) => {
    const result = await fetch(asset.Path);

    return {
      Lookup: asset.Lookup,
      Value: (await result.json()) as Record<string, unknown>,
    };
  });

  const assets = (await Promise.all(assetCalls)).reduce((prev, cur) => {
    return {
      ...prev,
      [cur.Lookup]: cur.Lookup == "Parameters"
        ? cur.Value.parameters
        : cur.Value,
    };
  }, {}) as {
    Content: Record<string, unknown>;
    Parameters: Record<string, unknown>;
  };

  return assets;
}

export async function loadCloudResourceGroupsConnections(
  logger: Logger,
  cloud: EaCCloudAsCode,
  resGroupsDef: Record<string, EaCCloudResourceGroupAsCode>,
  resGroups: Record<string, EaCCloudResourceGroupAsCode>,
  resGroupLookups: string[],
): Promise<Record<string, EaCCloudResourceGroupAsCode>> {
  const creds = await loadAzureCloudCredentials(cloud);

  const details = cloud.Details as EaCCloudAzureDetails;

  const resClient = new ResourceManagementClient(creds, details.SubscriptionID);

  const mappedCalls = resGroupLookups!.map(async (resGroupLookup) => {
    const resGroupDef = resGroupsDef && resGroupsDef[resGroupLookup]
      ? resGroupsDef[resGroupLookup]
      : {};

    let resLookups = Object.keys(resGroupDef.Resources || {});

    const resGroup = resGroups![resGroupLookup];

    if (resLookups.length === 0) {
      resLookups = Object.keys(resGroup.Resources || {});
    }

    const resGroupAzureResourcesResult = await resClient.resources
      .listByResourceGroup(resGroupLookup);

    const resGroupAzureResources: GenericResourceExpanded[] = [];

    for await (const resGroupAzureResource of resGroupAzureResourcesResult) {
      resGroupAzureResources.push(resGroupAzureResource);
    }

    const apiVersions = await loadResoureTypeApiVersions(
      resClient,
      resGroupAzureResources.map((rgar) => rgar.type!),
    );

    return {
      ResourceGroupLookup: resGroupLookup,
      ResourceGroup: {
        Resources: await loadCloudResourcesConnections(
          logger,
          creds,
          resGroupAzureResources,
          apiVersions,
          resGroupDef.Resources || {},
          resGroup.Resources || {},
          resLookups,
        ),
      },
    };
  }, {});

  const mapped = await Promise.all(mappedCalls);

  return mapped.reduce((rgs, rg) => {
    rgs[rg.ResourceGroupLookup] = rg.ResourceGroup;

    return rgs;
  }, {} as Record<string, EaCCloudResourceGroupAsCode>);
}

export async function loadCloudResourcesConnections(
  logger: Logger,
  creds: TokenCredential,
  azureResources: GenericResourceExpanded[],
  apiVersions: Record<string, string>,
  resourcesDef: Record<string, EaCCloudResourceAsCode>,
  resources: Record<string, EaCCloudResourceAsCode>,
  resLookups: string[],
): Promise<Record<string, EaCCloudResourceAsCode>> {
  const mappedCalls = resLookups!.map(async (resLookup) => {
    const resAzureResources = azureResources.filter(
      (ar) => ar.tags && ar.tags.ResourceLookup === resLookup,
    );

    const resKeys: Record<string, unknown> = {};

    const resLocations: Record<string, unknown> = {};

    const resPubProfiles: Record<string, unknown> = {};

    for (const ar of resAzureResources) {
      try {
        const apiVersion = apiVersions[ar.type!] || "2023-01-01";

        const resLookupKey = `${ar.type}/${ar.name}`;

        resKeys[resLookupKey] = await loadResourceKeys(
          creds,
          apiVersion,
          ar.id!,
          ar.type!,
        );

        resLocations[resLookupKey] = ar.location!;

        if (ar.type === "Microsoft.Web/sites") {
          resPubProfiles[resLookupKey] = await loadResourcePublishProfiles(
            creds,
            apiVersion,
            ar.id!,
          );
        }
      } catch (err) {
        logger.error(
          "There was an issue loadnig the cloud resources connections.",
          err,
        );
      }
    }

    const resDef = resourcesDef && resourcesDef[resLookup]
      ? resourcesDef[resLookup]
      : ({} as EaCCloudResourceAsCode);

    let resResLookups = Object.keys(resDef?.Resources || {});

    const res = resources![resLookup];

    if (resResLookups.length === 0) {
      resResLookups = Object.keys(res.Resources || {});
    }

    return {
      ResourceLookup: resLookup,
      Resource: {
        Keys: resKeys,
        Locations: resLocations,
        Profiles: resPubProfiles,
        Resources: await loadCloudResourcesConnections(
          logger,
          creds,
          azureResources,
          apiVersions,
          resDef?.Resources || {},
          res.Resources || {},
          resResLookups,
        ),
      },
    };
  }, {});

  const mapped = await Promise.all(mappedCalls);

  return mapped.reduce((rss, rs) => {
    rss[rs.ResourceLookup] = rs.Resource;

    return rss;
  }, {} as Record<string, EaCCloudResourceAsCode>);
}

export async function loadResourcePublishProfiles(
  creds: TokenCredential,
  apiVersion: string,
  resId: string,
): Promise<Record<string, unknown>> {
  const token = await creds.getToken([
    "https://management.azure.com//.default",
  ]);

  // const slotsResponse = await fetch(
  //   `https://management.azure.com${resId}/slots?api-version=${apiVersion}`,
  //   {
  //     method: "GET",
  //     headers: {
  //       Authorization: `Bearer ${token.token}`,
  //     },
  //   },
  // );

  // let slots = await slotsResponse.json();

  const pubProfilesResponse = await fetch(
    `https://management.azure.com${resId}/publishxml?api-version=${apiVersion}`,
    {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        Authorization: `Bearer ${token!.token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const pubXml = await pubProfilesResponse.text();

  const pubProfiles: Record<string, unknown> = {};

  pubProfiles["_"] = pubXml;

  // if (!keys.error) {
  //   if (Array.isArray(keys)) {
  //     keys.forEach((key) => (localKeys[key.keyName] = key.value));
  //   } else if (keys.value && Array.isArray(keys.value)) {
  //     (keys.value as Record<string, any>[]).forEach(
  //       (key) => (localKeys[key.keyName] = key.value || key.primaryKey),
  //     );
  //   } else {
  //     localKeys = keys;
  //   }
  // }

  return pubProfiles;
}

export async function loadResourceKeys(
  creds: TokenCredential,
  apiVersion: string,
  resId: string,
  resType: string,
): Promise<Record<string, unknown>> {
  const token = await creds.getToken([
    "https://management.azure.com//.default",
  ]);

  const keyPaths = [
    `https://management.azure.com${resId}/listKeys?api-version=${apiVersion}`,
    `https://management.azure.com${resId}/listConnectionStrings?api-version=${apiVersion}`,
    `https://management.azure.com${resId}//host/default/listKeys?api-version=${apiVersion}`,
    `https://management.azure.com${resId}/listQueryKeys?api-version=${apiVersion}`,
  ];

  let localKeys: Record<string, unknown> = {};

  const keyPathMaps: Record<string, number> = {
    "Microsoft.Devices/IotHubs": 0,
    "Microsoft.Storage/storageAccounts": 0,
    "Microsoft.OperationalInsights/workspaces": 0,
    "Microsoft.Web/sites": 2,
  };

  const keyPathIndex = keyPathMaps[resType];

  if (keyPathIndex >= 0) {
    const keyPath = keyPaths[keyPathIndex];

    const response = await fetch(keyPath, {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        Authorization: `Bearer ${token!.token}`,
      },
    });

    try {
      const keys = await response.json();

      if (!keys.error) {
        if (Array.isArray(keys)) {
          keys.forEach((key) => (localKeys[key.keyName] = key.value));
        } else if (keys.value && Array.isArray(keys.value)) {
          (keys.value as Record<string, any>[]).forEach(
            (key) => (localKeys[key.keyName] = key.value || key.primaryKey),
          );
        } else {
          localKeys = keys;
        }
      }
    } catch (e) {
      // e.toString();
    }
  }

  return localKeys;
}

export async function beginEaCDeployments(
  logger: Logger,
  commitId: string,
  cloud: EaCCloudAsCode,
  deployments: EaCCloudDeployment[],
): Promise<EaCActuatorCheckRequest[]> {
  logger.debug(`Beginning EaC commit ${commitId} Cloud deloyments`);

  const details = cloud.Details as EaCCloudAzureDetails;

  const creds = await loadAzureCloudCredentials(cloud);

  const resClient = new ResourceManagementClient(creds, details.SubscriptionID);

  const beginDeploymentCalls = deployments.map(async (deployment) => {
    const _beginDeploy = await resClient.deployments
      .beginCreateOrUpdateAtSubscriptionScope(
        // deployment.ResourceGroupLookup,
        deployment.Name,
        deployment.Deployment,
      );

    return {
      CommitID: commitId,
      CorelationID: crypto.randomUUID(),
      ...deployment,
    } as EaCActuatorCheckRequest;
  });

  const checks = await Promise.all(beginDeploymentCalls);

  return checks;
}

export async function loadDeploymentDetails(
  logger: Logger,
  commitId: string,
  cloud: EaCCloudAsCode,
  deploymentName: string,
  resGroupLookup?: string,
  resGroupLookupPassthrough?: string,
): Promise<{
  Deployment: DeploymentExtended;
  Messages: Record<string, unknown>;
}> {
  logger.debug(
    `Processing EaC commit ${commitId} Cloud checks for deployment ${deploymentName}`,
  );

  const details = cloud.Details as EaCCloudAzureDetails;

  const creds = await loadAzureCloudCredentials(cloud);

  const resClient = new ResourceManagementClient(creds, details.SubscriptionID);

  const getDeployment = resGroupLookup
    ? resClient.deployments.get(resGroupLookup, deploymentName)
    : resClient.deployments.getAtSubscriptionScope(deploymentName);

  const deployment = await getDeployment;

  const list = resGroupLookup
    ? resClient.deploymentOperations.list(resGroupLookup, deploymentName)
    : resClient.deploymentOperations.listAtSubscriptionScope(deploymentName);

  const ops = await list;

  const messages: Record<string, unknown> = {
    [deploymentName]: {
      LastActivity: deployment.properties!.timestamp,
      State: deployment.properties!.provisioningState,
    },
  };

  for await (const operation of ops) {
    const nextResource = operation.properties!.targetResource?.resourceName!;

    if (
      operation.properties?.targetResource?.resourceType ===
        "Microsoft.Resources/deployments"
    ) {
      const subDeployDetails = await loadDeploymentDetails(
        logger,
        commitId,
        cloud,
        nextResource,
        resGroupLookupPassthrough,
        resGroupLookupPassthrough,
      );

      messages[deploymentName] = merge(
        messages[deploymentName] as object,
        subDeployDetails.Messages,
      );
    } else if (nextResource) {
      messages[deploymentName] = merge(messages[deploymentName] as object, {
        [nextResource]: {
          // Duration: operation.properties!.duration,
          LastActivity: operation.properties!.timestamp,
          Message: operation.properties!.statusMessage,
          Operation: operation.properties!.provisioningOperation,
          State: operation.properties!.provisioningState,
          Status: operation.properties!.statusCode,
          Type: operation.properties!.targetResource?.resourceType,
        },
      });
    }
  }

  return {
    Deployment: deployment,
    Messages: messages,
  };
}

export function formatParameters(
  parameters: Record<string, unknown>,
  paramsTemplate: Record<string, unknown>,
): Record<string, unknown> {
  const params = JSON.stringify(paramsTemplate);

  const result = Handlebars.compile(params)(parameters);

  return JSON.parse(result) as Record<string, unknown>;
}
