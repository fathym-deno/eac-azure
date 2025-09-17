import {
  type EaCCloudAsCode,
  type EaCCloudAzureDetails,
  type EaCCloudResourceAsCode,
  type EaCCloudResourceGroupAsCode,
  type GenericResourceExpanded,
  type Logger,
  ResourceManagementClient,
  type TokenCredential,
} from "../.deps.ts";
import { loadAzureCloudCredentials } from "../loadAzureCloudCredentials.ts";
import { loadResoureTypeApiVersions } from "../loadResoureTypeApiVersions.ts";

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
  });

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
    const resAzureResources = azureResources.filter((ar) =>
      ar.tags?.["ResourceLookup"] === resLookup
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
  });

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

  const keyPathIndex = keyPathMaps[resType as keyof typeof keyPathMaps];

  if (keyPathIndex >= 0) {
    const keyPath = keyPaths[keyPathIndex];
    const response = await fetch(keyPath, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { Authorization: `Bearer ${token!.token}` },
    });
    try {
      const keys = await response.json();
      if (!keys.error) {
        if (Array.isArray(keys)) {
          (keys as { keyName: string; value?: unknown }[]).forEach((key) => {
            localKeys[key.keyName] = key.value as unknown;
          });
        } else if (keys.value && Array.isArray(keys.value)) {
          (keys.value as {
            keyName: string;
            value?: unknown;
            primaryKey?: unknown;
          }[])
            .forEach((key) => {
              localKeys[key.keyName] = (key.value as unknown) ??
                (key.primaryKey as unknown);
            });
        } else {
          localKeys = keys;
        }
      }
    } catch {
      // swallow json parse if not json
    }
  }

  return localKeys;
}
