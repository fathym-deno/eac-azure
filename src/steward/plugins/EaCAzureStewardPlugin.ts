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

export type EaCAzureStewardPluginOptions = EaCStewardPluginOptions;

export default class EaCAzureStewardPlugin implements EaCRuntimePlugin {
  constructor(protected options?: EaCAzureStewardPluginOptions) {}

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const stewardApiMetaPath = import.meta.resolve("../steward/api");

    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = buildStewardApiPluginConfig(
      EaCAzureStewardPlugin.name,
      stewardApiMetaPath,
      "core",
      "steward-azure",
      "fathym:eac-azure/steward/api",
      "/api/steward/azure*",
      "@fathym/eac-azure",
      this.options,
    );

    return Promise.resolve(pluginConfig);
  }
}
