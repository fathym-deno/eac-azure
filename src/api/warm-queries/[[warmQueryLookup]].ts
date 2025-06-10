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

    const lookup = ctx.Params.warmQueryLookup as string;

    const eac: EverythingAsCodeClouds = await eacSvc.EaC.Get();

    return Response.json(JSON.stringify(eac.WarmQueries![lookup].Details!));
  },
  async POST(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup;

    const eacSvc = await loadEaCStewardSvc(entLookup!, ctx.State.Username!);

    const formData = await req.formData();

    const lookup = ctx.Params.warmQueryLookup as string;

    const eac: EverythingAsCode & EverythingAsCodeClouds = {
      EnterpriseLookup: ctx.State.EnterpriseLookup,
      WarmQueries: {
        [lookup]: {
          Details: {
            Name: formData.get("name")!.toString(),
            Description: formData.get("name")!.toString(),
            Version: 1,
            Query: formData.get("query")!.toString(),
          },
        },
      },
    };

    const commitResp = await eacSvc.EaC.Commit(eac, 60);

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

    const eacSvc = await loadEaCStewardSvc(entLookup!, ctx.State.Username!);

    const wrapped: Record<string, EverythingAsCodeClouds & EverythingAsCode> = {
      eac: {
        EnterpriseLookup: ctx.State.EnterpriseLookup,
        WarmQueries: {
          [lookup]: {},
        },
      },
    };

    const commitResp = await eacSvc.EaC.Delete(wrapped, false, 60);

    const status = await waitForStatus(
      eacSvc,
      commitResp.EnterpriseLookup,
      commitResp.CommitID,
    );

    return Response.json(JSON.stringify(status));
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
