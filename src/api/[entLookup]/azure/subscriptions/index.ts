import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  loadAzureCredentialsForToken,
  Subscription,
  SubscriptionClient,
} from "../../../.deps.ts";

export default {
  async GET(req, ctx) {
    const entLookup = ctx.State.UserEaC!.EnterpriseLookup;

    const azureAccessToken = req.headers.get("x-eac-azure-access-token")!;

    const creds = await loadAzureCredentialsForToken(azureAccessToken);

    const subs: Subscription[] = [];

    if (creds) {
      const subClient = new SubscriptionClient(creds);

      const subsList = subClient.subscriptions.list();

      for await (const sub of subsList) {
        if (sub.state !== "Disabled" && sub.state !== "Deleted") {
          subs.push(sub);
        }
      }
    }

    return Response.json(subs);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
