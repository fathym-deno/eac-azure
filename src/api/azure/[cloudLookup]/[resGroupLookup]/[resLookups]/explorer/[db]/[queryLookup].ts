import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  EverythingAsCodeClouds,
  loadEaCStewardSvc,
  loadKustoClient,
} from "../../../../../../.deps.ts";
import { ExplorerRequest } from "../../../../../../ExplorerRequest.ts";

export default {
  async GET(req, ctx) {
    debugger;
    const entLookup = ctx.State.EnterpriseLookup!;

    const cloudLookup = ctx.Params.cloudLookup as string;

    const resGroupLookup = ctx.Params.resGroupLookup as string;

    const resLookups = decodeURIComponent(
      ctx.Params.resLookups as string,
    ).split("|");

    const db = ctx.Params.db as string;

    const url = new URL(req.url);

    const svcSuffix = url.searchParams.get("svcSuffix") as string | undefined;

    const lookup = ctx.Params.queryLookup as string;

    const eacSvc = await loadEaCStewardSvc(entLookup, ctx.State.Username!);

    const eac: EverythingAsCodeClouds = await eacSvc.EaC.Get();

    const kustoClient = await loadKustoClient(
      entLookup,
      cloudLookup,
      resGroupLookup,
      resLookups,
      async (entLookup) => {
        const eacSvc = await loadEaCStewardSvc(entLookup, ctx.State.Username!);

        return await eacSvc.EaC.Get();
      },
      svcSuffix,
    );

    kustoClient.ensureOpen();

    const dataSetResp = await kustoClient.execute(db, eac.WarmQueries![lookup].Details!.Query);

    return Response.json(JSON.stringify(dataSetResp));
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
