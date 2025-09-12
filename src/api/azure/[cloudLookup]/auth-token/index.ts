import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  EverythingAsCodeClouds,
  loadAzureCloudCredentials,
  loadEaCStewardSvc,
} from "../../../.deps.ts";

export default {
  async GET(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup!;

    const cloudLookup = ctx.Params.cloudLookup as string;

    const url = new URL(req.url);

    const scopes: string[] = (url.searchParams.get("scope") as string).split(
      ",",
    );

    const eacSvc = await loadEaCStewardSvc(entLookup, ctx.State.Username!);

    const eac: EverythingAsCodeClouds = await eacSvc.EaC.Get();

    const creds = await loadAzureCloudCredentials(eac, cloudLookup);

    const authToken = await creds.getToken(scopes);

    return Response.json({
      Token: authToken?.token,
    });
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
