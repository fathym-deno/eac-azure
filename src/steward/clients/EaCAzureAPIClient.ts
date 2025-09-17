import {
  BillingAccount,
  BillingProfile,
  EaCBaseClient,
  EaCServiceDefinitions,
  ExplorerRequest,
  InvoiceSection,
  KustoResponseDataSet,
  Location,
  Subscription,
  TenantIdDescription,
} from "./.deps.ts";

export class EaCAzureAPIClient extends EaCBaseClient {
  constructor(baseUrl: URL, apiToken: string) {
    super(baseUrl, apiToken);
  }

  public Azure = {
    BillingAccounts: async (
      azureAccessToken: string,
    ): Promise<BillingAccount[]> => {
      const response = await fetch(
        this.loadClientUrl(`billing/accounts`),
        {
          method: "GET",
          headers: this.loadHeaders({
            "x-eac-azure-access-token": azureAccessToken,
          }),
        },
      );

      return await this.json(response);
    },

    BillingProfiles: async (
      azureAccessToken: string,
      billingAccountName: string,
    ): Promise<BillingProfile[]> => {
      const u = this.loadClientUrl(
        `billing/profiles?billingAccountName=${
          encodeURIComponent(billingAccountName)
        }`,
      );
      const response = await fetch(u, {
        method: "GET",
        headers: this.loadHeaders({
          "x-eac-azure-access-token": azureAccessToken,
        }),
      });

      return await this.json(response);
    },

    BillingInvoiceSections: async (
      azureAccessToken: string,
      billingAccountName: string,
      billingProfileName: string,
    ): Promise<InvoiceSection[]> => {
      const u = this.loadClientUrl(
        `billing/invoice-sections?billingAccountName=${
          encodeURIComponent(billingAccountName)
        }&billingProfileName=${encodeURIComponent(billingProfileName)}`,
      );
      const response = await fetch(u, {
        method: "GET",
        headers: this.loadHeaders({
          "x-eac-azure-access-token": azureAccessToken,
        }),
      });

      return await this.json(response);
    },

    Subscriptions: async (
      azureAccessToken: string,
    ): Promise<Subscription[]> => {
      const response = await fetch(this.loadClientUrl(`subscriptions`), {
        method: "GET",
        headers: this.loadHeaders({
          "x-eac-azure-access-token": azureAccessToken,
        }),
      });

      return await this.json(response);
    },

    Tenants: async (
      azureAccessToken: string,
    ): Promise<TenantIdDescription[]> => {
      const response = await fetch(this.loadClientUrl(`tenants`), {
        method: "GET",
        headers: this.loadHeaders({
          "x-eac-azure-access-token": azureAccessToken,
        }),
      });

      return await this.json(response);
    },
  };

  public Cloud = {
    APIVersions: async (
      cloudLookup: string,
      svcDefs: EaCServiceDefinitions,
    ): Promise<Record<string, string>> => {
      const response = await fetch(
        this.loadClientUrl(`${cloudLookup}/api-versions`),
        {
          method: "POST",
          headers: this.loadHeaders(),
          body: JSON.stringify(svcDefs),
        },
      );

      return await this.json(response);
    },

    AuthToken: async (
      cloudLookup: string,
      scopes: string[],
    ): Promise<string> => {
      const response = await fetch(
        this.loadClientUrl(
          `${cloudLookup}/auth-token?scope=${scopes.join(",")}`,
        ),
        {
          method: "GET",
          headers: this.loadHeaders(),
        },
      );

      return await this.json(response, "");
    },

    EnsureProviders: async (
      cloudLookup: string,
      svcDefs: EaCServiceDefinitions,
    ): Promise<{
      Locations: Location[];
    }> => {
      const response = await fetch(
        this.loadClientUrl(`${cloudLookup}/providers`),
        {
          method: "POST",
          headers: this.loadHeaders(),
          body: JSON.stringify(svcDefs),
        },
      );

      return await this.json(response);
    },

    Locations: async (
      cloudLookup: string,
      svcDefs: EaCServiceDefinitions,
    ): Promise<{
      Locations: Location[];
    }> => {
      const response = await fetch(
        this.loadClientUrl(`${cloudLookup}/locations`),
        {
          method: "POST",
          headers: this.loadHeaders(),
          body: JSON.stringify(svcDefs),
        },
      );

      return await this.json(response);
    },
  };

  public DataLake = {
    Execute: async (
      cloudLookup: string,
      resGroupLookup: string,
      resLookups: string[],
      fileSystem: string,
      resultType: "json" | "csv" | "jsonl",
      flatten?: boolean,
      download?: boolean,
    ): Promise<Response> => {
      const res = resLookups.join("|");

      const resultTypeQuery = resultType
        ? `resultType=${resultType}`
        : undefined;

      const flattenQuery = flatten ? `flatten=${flatten}` : undefined;

      const downloadQuery = download ? `download=${download}` : undefined;

      const query = [resultTypeQuery, flattenQuery, downloadQuery]
        .filter((q) => q)
        .join("&");

      const response = await fetch(
        this.loadClientUrl(
          `${cloudLookup}/${resGroupLookup}/${res}/data-lake/${fileSystem}?${query}`,
        ),
        {
          method: "GET",
          headers: this.loadHeaders(),
        },
      );

      return response;
    },
  };

  public Explorer = {
    Query: async (
      cloudLookup: string,
      resGroupLookup: string,
      resLookups: string[],
      db: string,
      request: ExplorerRequest,
    ): Promise<KustoResponseDataSet> => {
      const res = resLookups.join("|");

      const response = await fetch(
        this.loadClientUrl(
          `${cloudLookup}/${resGroupLookup}/${res}/explorer/${db}`,
        ),
        {
          method: "POST",
          headers: this.loadHeaders(),
          body: JSON.stringify(request),
        },
      );

      return await this.json(response);
    },
  };
}
