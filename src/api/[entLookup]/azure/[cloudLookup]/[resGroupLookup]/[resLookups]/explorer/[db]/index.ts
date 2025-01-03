import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  EverythingAsCodeClouds,
  loadKustoClient,
} from "../../../../../../../.deps.ts";
import { ExplorerRequest } from "../../../../../../../ExplorerRequest.ts";

export default {
  async POST(req, ctx) {
    const entLookup = ctx.State.UserEaC!.EnterpriseLookup;

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
        const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

        const eac = await eacKv.get<EverythingAsCodeClouds>([
          "EaC",
          "Current",
          entLookup,
        ]);

        return eac.value!;
      },
      svcSuffix,
    );

    kustoClient.ensureOpen();

    const dataSetResp = await kustoClient.execute(db, explorerReq.Query);

    return Response.json(JSON.stringify(dataSetResp));
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;