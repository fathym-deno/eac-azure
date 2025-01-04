import {
  buildStewardApiPluginConfig,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EaCStewardPluginOptions,
  EverythingAsCode,
  EverythingAsCodeApplications,
  EverythingAsCodeDenoKV,
} from "./.deps.ts";

export type EaCAzureCloudsStewardPluginOptions = EaCStewardPluginOptions;

export default class EaCAzureCloudsStewardPlugin implements EaCRuntimePlugin {
  constructor(protected options?: EaCAzureCloudsStewardPluginOptions) {}

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const stewardApiMetaPath = import.meta.resolve("../steward/api/clouds");

    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = buildStewardApiPluginConfig(
      EaCAzureCloudsStewardPlugin.name,
      stewardApiMetaPath,
      "core",
      "steward-azure-clouds",
      "fathym:eac-azure/steward/api/clouds",
      "/api/steward/azure/clouds*",
      "@fathym/eac-azure",
      this.options!,
      "/src/steward/clouds/",
    );

    return Promise.resolve(pluginConfig);
  }
}
