import {
  BillingManagementClient,
  type BillingProfile,
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  loadAzureCredentialsForToken,
} from "../../.deps.ts";

export default {
  async GET(req, ctx) {
    const azureAccessToken = req.headers.get("x-eac-azure-access-token")!;

    const creds = await loadAzureCredentialsForToken(azureAccessToken);

    const url = new URL(req.url);
    const billingAccountName = url.searchParams.get("billingAccountName");

    const profiles: BillingProfile[] = [];

    if (creds && billingAccountName) {
      try {
        const subscriptionId = "00000000-0000-0000-0000-000000000000";

        const billingClient = new BillingManagementClient(
          creds,
          subscriptionId,
        );

        const pager = billingClient.billingProfiles.listByBillingAccount(
          billingAccountName,
        );

        for await (const p of pager) {
          profiles.push(p as BillingProfile);
        }
      } catch (err) {
        ctx.Runtime.Logs.Package.error(
          "There was an error loading the billing profiles.",
          err,
        );
      }
    }

    return Response.json(profiles);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
