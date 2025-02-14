import {
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  loadAzureCredentialsForToken,
  SubscriptionClient,
  TenantIdDescription,
} from "../../.deps.ts";

export default {
  async GET(req, ctx) {
    const azureAccessToken = req.headers.get("x-eac-azure-access-token")!;

    const creds = await loadAzureCredentialsForToken(azureAccessToken);

    const tenantCheck = new Promise((resolve, reject) => {
      const work = async () => {
        const tenants: TenantIdDescription[] = [];

        if (creds) {
          try {
            const subClient = new SubscriptionClient(creds);

            const tenantsList = subClient.tenants.list();

            for await (const tenant of tenantsList) {
              tenants.push(tenant);
            }

            resolve(tenants);
          } catch (err) {
            ctx.Runtime.Logs.Package.error(
              "There was an error loading the tenant.",
              err,
            );

            reject(err);
          }
        } else {
          resolve(tenants);
        }
      };

      work();
    });

    return Response.json(await tenantCheck);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
