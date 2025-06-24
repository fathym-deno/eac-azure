import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  EverythingAsCode,
  EverythingAsCodeClouds,
  loadEaCStewardSvc,
} from "../.deps.ts";
import { ExplorerRequest } from "../ExplorerRequest.ts";

export default {
  async GET(req, ctx) {
    //debugger;
    const entLookup = ctx.State.EnterpriseLookup;

    const url = new URL(req.url);
    const allVersions = url.searchParams.get("allVersions");

    const eacSvc = await loadEaCStewardSvc(entLookup!, ctx.State.Username!);

    const eac: EverythingAsCode & EverythingAsCodeClouds = await eacSvc.EaC
      .Get();

    const queries = eac.WarmQueries ?? {};

    let result: Record<string, EverythingAsCode> = {};

    if (allVersions === "true") {
      // Return all queries exactly
      result = queries;
    } else {
      // Group by lookup (before "_{version}")
      const groups: Record<
        string,
        { key: string; version: number; value: EverythingAsCode }[]
      > = {};

      // Step 1: Build groups
      for (const [key, value] of Object.entries(queries)) {
        const lookupPrefix = key.split("|")[0]; // Take part before underscore
        const version = value?.Details?.Version ?? 0;

        if (!groups[lookupPrefix]) {
          groups[lookupPrefix] = [];
        }

        groups[lookupPrefix].push({ key, version, value });
      }

      // Step 2: For each group, find highest version
      for (const [lookup, entries] of Object.entries(groups)) {
        const latest = entries.sort((a, b) => b.version - a.version)[0]; // Highest version first
        result[latest.key] = latest.value;
      }
    }

    const transformed = Object.entries(result ?? {}).map(
      ([key, value]) => ({
        Name: value.Details!.Name,
        Description: value.Details!.Description,
        Version: value.Details!.Version,
        Query: value.Details!.Query,
        Lookup: key.split("|")[0],
      }),
    );

    return Response.json(transformed);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
