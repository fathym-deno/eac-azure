import { merge, ResourceManagementClient } from "./.deps.ts";

/**
 * Load API versions for the specified resource types.
 *
 * @param resClient The Azure Resource Management client instance.
 * @param resourceTypes The resource types to retrieve API versions for.
 * @returns The API versions for the specified resource types.
 */
export async function loadResoureTypeApiVersions(
  resClient: ResourceManagementClient,
  resourceTypes: string[],
): Promise<Record<string, string>> {
  const calls = resourceTypes.map(async (resourceType) => {
    const [providerType, ...resType] = resourceType.split("/");

    const provider = await resClient.providers.get(providerType);

    const providerTypeApiVersions = provider.resourceTypes
      ?.filter((rt) => {
        return resType.join("/") === rt.resourceType!;
      })
      .map((rt) => {
        return {
          type: [providerType, rt.resourceType!].join("/"),
          apiVersion: rt.defaultApiVersion || rt.apiVersions![0],
        };
      })!;

    const res = providerTypeApiVersions.reduce((p, c) => {
      p[c.type] = c.apiVersion;

      return p;
    }, {} as Record<string, string>);

    return res;
  });

  const apiVersionResults = await Promise.all(calls);

  return merge(...apiVersionResults);
}
