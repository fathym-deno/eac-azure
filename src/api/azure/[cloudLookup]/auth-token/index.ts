import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  EverythingAsCodeClouds,
  loadAzureCloudCredentials,
} from "../../../.deps.ts";

export default {
  async GET(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup;

    const cloudLookup = ctx.Params.cloudLookup as string;

    const url = new URL(req.url);

    const scopes: string[] = (url.searchParams.get("scope") as string).split(
      ",",
    );

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

    const eacResult = await eacKv.get<EverythingAsCodeClouds>([
      "EaC",
      "Current",
      entLookup,
    ]);

    const eac = eacResult.value!;

    const creds = await loadAzureCloudCredentials(eac, cloudLookup);

    const authToken = await creds.getToken(scopes);

    return Response.json({
      Token: authToken?.token,
    });
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
