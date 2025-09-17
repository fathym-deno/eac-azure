import { Handlebars } from "../.deps.ts";
import type { EaCCloudResourceFormatDetails } from "../.deps.ts";

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
        ? (cur.Value as Record<string, unknown>).parameters
        : cur.Value,
    };
  }, {}) as {
    Content: Record<string, unknown>;
    Parameters: Record<string, unknown>;
  };

  return assets;
}

export function formatParameters(
  parameters: Record<string, unknown>,
  paramsTemplate: Record<string, unknown>,
): Record<string, unknown> {
  const params = JSON.stringify(paramsTemplate);
  const result = Handlebars.compile(params)(parameters);
  return JSON.parse(result) as Record<string, unknown>;
}
