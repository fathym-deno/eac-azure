import {
  EaCAPIProcessor,
  EaCApplicationAsCode,
  EaCDistributedFileSystemDetails,
  EaCJSRDistributedFileSystemDetails,
  EaCLocalDistributedFileSystemDetails,
  EaCProjectAsCode,
  EaCRuntimeConfig,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  EverythingAsCode,
  EverythingAsCodeApplications,
  EverythingAsCodeDenoKV,
  IoCContainer,
} from "./.deps.ts";

export type EaCAzureAPIPluginOptions = {
  DFS?: {
    Details?: EaCDistributedFileSystemDetails;

    Lookup?: string;
  };

  Application?: {
    JWTValidationModifier?: {
      Lookup?: string;

      Priority?: number;
    };

    Lookup?: string;

    Path?: string;

    Priority?: number;
  };

  Project?: {
    Lookup?: string;
  };
};

export default class EaCAzureAPIPlugin implements EaCRuntimePlugin {
  constructor(protected options?: EaCAzureAPIPluginOptions) {}

  public Setup(_config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const stewardApiMetaPath = import.meta.resolve("../../api/azure");

    const fileScheme = "file:///";

    const projLookup = this.options?.Project?.Lookup ?? "core";

    const appLookup = this.options?.Application?.Lookup ?? "api-azure";

    const dfsLookup = this.options?.DFS?.Lookup ?? "fathym:eac-azure/api/azure";

    const jwtValidationLookup = this.options?.Application?.JWTValidationModifier
      ?.Lookup;

    const pluginConfig: EaCRuntimePluginConfig<
      EverythingAsCode & EverythingAsCodeApplications & EverythingAsCodeDenoKV
    > = {
      Name: EaCAzureAPIPlugin.name,
      IoC: new IoCContainer(),
      EaC: {
        Projects: {
          [projLookup]: {
            ApplicationResolvers: {
              [appLookup]: {
                PathPattern: this.options?.Application?.Path ??
                  "/api/azure*",
                Priority: this.options?.Application?.Priority ?? 700,
              },
            },
          } as EaCProjectAsCode,
        },
        Applications: {
          [appLookup]: {
            Details: {
              Name: "Azure API Endpoints",
              Description: "The Azure API endpoints for utils.",
            },
            ModifierResolvers: {
              ...(jwtValidationLookup
                ? {
                  [jwtValidationLookup]: {
                    Priority: this.options!.Application!.JWTValidationModifier!
                      .Priority ?? 900,
                  },
                }
                : {}),
            },
            Processor: {
              Type: "API",
              DFSLookup: dfsLookup,
            } as EaCAPIProcessor,
          } as EaCApplicationAsCode,
        },
        DFSs: {
          [dfsLookup]: {
            Details: this.options?.DFS?.Details ??
                stewardApiMetaPath.startsWith(fileScheme)
              ? ({
                Type: "Local",
                FileRoot: stewardApiMetaPath.slice(fileScheme.length),
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac/dfs/workers/local",
                ),
              } as EaCLocalDistributedFileSystemDetails)
              : ({
                Type: "JSR",
                Package: "@fathym/eac-azure",
                Version: "",
                FileRoot: "/src/api/azure/",
                DefaultFile: "index.ts",
                Extensions: ["ts"],
                WorkerPath: import.meta.resolve(
                  "@fathym/eac/dfs/workers/jsr",
                ),
              } as EaCJSRDistributedFileSystemDetails),
          },
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
