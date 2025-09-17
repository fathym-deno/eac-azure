import {
  BillingManagementClient,
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  type InvoiceSection,
  loadAzureCredentialsForToken,
} from "../../.deps.ts";

export default {
  async GET(req, ctx) {
    const azureAccessToken = req.headers.get("x-eac-azure-access-token")!;

    const creds = await loadAzureCredentialsForToken(azureAccessToken);

    const url = new URL(req.url);
    const billingAccountName = url.searchParams.get("billingAccountName");
    const billingProfileName = url.searchParams.get("billingProfileName");

    const sections: InvoiceSection[] = [];

    if (creds && billingAccountName && billingProfileName) {
      try {
        const subscriptionId = "00000000-0000-0000-0000-000000000000";

        const billingClient = new BillingManagementClient(
          creds,
          subscriptionId,
        );

        const pager = billingClient.invoiceSections.listByBillingProfile(
          billingAccountName,
          billingProfileName,
        );

        for await (const s of pager) {
          sections.push(s as InvoiceSection);
        }
      } catch (err) {
        ctx.Runtime.Logs.Package.error(
          "There was an error loading the invoice sections.",
          err,
        );
      }
    }

    return Response.json(sections);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
