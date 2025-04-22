import {
    EaCRuntimeHandlers,
    EaCStewardAPIState,
    EverythingAsCodeClouds,
    EverythingAsCode,
    loadEaCStewardSvc
  } from "../.deps.ts"
  import { ExplorerRequest } from "../ExplorerRequest.ts"
  
  export default {
    async GET(req, ctx) {
        const entLookup = ctx.State.EnterpriseLookup;

        const eacSvc = await loadEaCStewardSvc(entLookup!, ctx.State.Username!);

        const eac: EverythingAsCode & EverythingAsCodeClouds = await eacSvc.EaC.Get();

        const transformed = Object.entries(eac.WarmQueries ?? {}).map(
          ([_, value]) => (value.Details!)
        );
  
      return Response.json(JSON.stringify(transformed));
    },
  } as EaCRuntimeHandlers<EaCStewardAPIState>;
  