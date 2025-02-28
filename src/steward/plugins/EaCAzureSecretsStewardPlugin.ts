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

export type EaCAzureSecretsStewardPluginOptions = EaCStewardPluginOptions;

export default class EaCAzureSecretsStewardPlugin implements EaCRuntimePlugin {
  constructor(protected options?: EaCAzureSecretsStewardPluginOptions) {}

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const stewardApiMetaPath = import.meta.resolve("../api/secrets");

    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = buildStewardApiPluginConfig(
      EaCAzureSecretsStewardPlugin.name,
      stewardApiMetaPath,
      "core",
      "steward-azure-secrets",
      "fathym:eac-azure/steward/api/secrets",
      "/api/steward/secrets/azure*",
      "@fathym/eac-azure",
      this.options!,
      "/src/steward/secrets/",
    );

    return Promise.resolve(pluginConfig);
  }
}
