import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  EverythingAsCode,
  EverythingAsCodeClouds,
  loadEaCStewardSvc,
  waitForStatus,
} from "../.deps.ts";
import { ExplorerRequest } from "../ExplorerRequest.ts";

export default {
  async GET(req, ctx) {

    const entLookup = ctx.State.EnterpriseLookup;

    const eacSvc = await loadEaCStewardSvc(entLookup!, ctx.State.Username!);

    const url = new URL(req.url);
    const reqVersion = url.searchParams.get("version");

    const lookup = ctx.Params.warmQueryLookup as string;

    const eac: EverythingAsCodeClouds = await eacSvc.EaC.Get();

    const warmQueries = eac.WarmQueries ?? {}; // fallback if WarmQueries undefined

    let result:
      | EverythingAsCode
      | EverythingAsCode[]
      | undefined;

    if (reqVersion === "all") {
      // Return all matching
      result = Object.entries(warmQueries)
        .filter(([key]) => key.split("|")[0] == lookup)
        .map(
            ([key, value]) => ({
              Name: value.Details!.Name,
              Description: value.Details!.Description,
              Version: value.Details!.Version,
              Query: value.Details!.Query,
            }));
    } else if (reqVersion) {
      // Return exact match lookup_version
      const specificKey = `${lookup}|${reqVersion}`;
      result = warmQueries[specificKey];
      if (result)
        result = result.Details!;
    } else {
      // reqVersion is empty or null: find highest version
      const bestMatch = Object.entries(warmQueries)
        .filter(([key]) => key.split("|")[0] == lookup)
        .map(
            ([key, value]) => ({
              Name: value.Details!.Name,
              Description: value.Details!.Description,
              Version: value.Details!.Version,
              Query: value.Details!.Query,
            }))
        .sort((a, b) => b.Version - a.Version)[0];

      result = bestMatch;
    }

    if (result)
        return Response.json(result);
    else
        return Response.json({status: "Not Found"});
  },
  async POST(req, ctx) {
    //debugger;
    const entLookup = ctx.State.EnterpriseLookup;

    let version = 1;

    const eacSvc = await loadEaCStewardSvc(entLookup!, ctx.State.Username!);

    const body = await req.json();

    const lookup = ctx.Params.warmQueryLookup as string;

    const eac: EverythingAsCodeClouds = await eacSvc.EaC.Get();

    const matchingQuery = Object.entries(eac.WarmQueries ?? {})
      .filter(([key]) => key.split("|")[0] == lookup)
      .map(([key, value]) => ({
        key,
        value,
        version: value?.Details?.Version ?? 0, // safely handle missing Details/Version
      }))
      .sort((a, b) => b.version - a.version) // highest version first
      [0]; // get the first item (highest version)

    if (matchingQuery) {
      version = matchingQuery.value.Details!.Version;

      if (matchingQuery.value.Details!.Query != body.query) {
        version++;
      }
    }

    const newEac: EverythingAsCode & EverythingAsCodeClouds = {
      EnterpriseLookup: ctx.State.EnterpriseLookup,
      WarmQueries: {
        [`${lookup}|${version}`]: {
          Details: {
            Name: body.name,
            Description: body.name,
            Version: version,
            Query: body.query,
          },
        },
      },
    };

    const commitResp = await eacSvc.EaC.Commit(newEac, 60);

    const status = await waitForStatus(
      eacSvc,
      commitResp.EnterpriseLookup,
      commitResp.CommitID,
    );

    return Response.json(JSON.stringify(status));
  },
  async DELETE(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup;

    const lookup = ctx.Params.warmQueryLookup as string;

    const url = new URL(req.url);
    const allVersions = url.searchParams.get("allVersions");

    const eacSvc = await loadEaCStewardSvc(entLookup!, ctx.State.Username!);

    const eac: EverythingAsCodeClouds = await eacSvc.EaC.Get();

    const queries = eac.WarmQueries ?? {};

    let keysToDelete: string[] = [];

    if (allVersions === "true") {
      // Delete all keys starting with lookup
      keysToDelete = Object.keys(queries).filter((key) =>
        key.split("|")[0] == lookup
      );
    } else {
      // Delete only the key with highest version
      const bestMatch = Object.entries(queries)
        .filter(([key]) => key.split("|")[0] == lookup)
        .map(([key, value]) => ({
          key,
          version: value?.Details?.Version ?? 0,
        }))
        .sort((a, b) => b.version - a.version)[0];

      if (bestMatch) {
        keysToDelete.push(bestMatch.key);
      }
    }

    // Now construct the deletion payload
    const eacDeletePayload = {
      EnterpriseLookup: ctx.State.EnterpriseLookup,
      WarmQueries: keysToDelete.reduce((acc, key) => {
        acc[key] = null; // setting to null indicates deletion
        return acc;
      }, {} as Record<string, null>),
    };

    // Commit the delete
    const commitResp = await eacSvc.EaC.Delete(
      eacDeletePayload as unknown as any,
      false,
      60,
    );

    const status = await waitForStatus(
      eacSvc,
      commitResp.EnterpriseLookup,
      commitResp.CommitID,
    );

    return Response.json(status);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
