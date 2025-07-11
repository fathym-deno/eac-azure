import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  EverythingAsCodeClouds,
  loadEaCStewardSvc,
  loadKustoClient,
} from "../../../../../../.deps.ts";
import { ExplorerRequest } from "../../../../../../ExplorerRequest.ts";

export default {
  async POST(req, ctx) {
    //debugger;
    const entLookup = ctx.State.EnterpriseLookup!;

    const cloudLookup = ctx.Params.cloudLookup as string;

    const resGroupLookup = ctx.Params.resGroupLookup as string;

    const resLookups = decodeURIComponent(
      ctx.Params.resLookups as string,
    ).split("|");

    const db = ctx.Params.db as string;

    const url = new URL(req.url);

    const svcSuffix = url.searchParams.get("svcSuffix") as string | undefined;

    const explorerReq: ExplorerRequest = await req.json();

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

    const dataSetResp = await kustoClient.execute(db, explorerReq.Query);

    return Response.json(dataSetResp);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
