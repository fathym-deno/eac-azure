import {
  BillingAccount,
  EaCBaseClient,
  EaCServiceDefinitions,
  ExplorerRequest,
  KustoResponseDataSet,
  Subscription,
  TenantIdDescription,
} from "./.deps.ts";

export class EaCAzureStewardClient extends EaCBaseClient {
  constructor(baseUrl: URL, apiToken: string) {
    super(baseUrl, apiToken);
  }

  public Azure = {
    BillingAccounts: async (
      entLookup: string,
      azureAccessToken: string,
    ): Promise<BillingAccount[]> => {
      const response = await fetch(
        this.loadClientUrl(`${entLookup}/azure/billing/accounts`),
        {
          method: "GET",
          headers: this.loadHeaders({
            "x-eac-azure-access-token": azureAccessToken,
          }),
        },
      );

      return await this.json(response);
    },

    Subscriptions: async (
      entLookup: string,
      azureAccessToken: string,
    ): Promise<Subscription[]> => {
      const response = await fetch(
        this.loadClientUrl(`${entLookup}/azure/subscriptions`),
        {
          method: "GET",
          headers: this.loadHeaders({
            "x-eac-azure-access-token": azureAccessToken,
          }),
        },
      );

      return await this.json(response);
    },

    Tenants: async (
      entLookup: string,
      azureAccessToken: string,
    ): Promise<TenantIdDescription[]> => {
      const response = await fetch(
        this.loadClientUrl(`${entLookup}/azure/tenants`),
        {
          method: "GET",
          headers: this.loadHeaders({
            "x-eac-azure-access-token": azureAccessToken,
          }),
        },
      );

      return await this.json(response);
    },
  };

  public Cloud = {
    APIVersions: async (
      entLookup: string,
      cloudLookup: string,
      svcDefs: EaCServiceDefinitions,
    ): Promise<Record<string, string>> => {
      const response = await fetch(
        this.loadClientUrl(`${entLookup}/azure/${cloudLookup}/api-versions`),
        {
          method: "POST",
          headers: this.loadHeaders(),
          body: JSON.stringify(svcDefs),
        },
      );

      return await this.json(response);
    },

    AuthToken: async (
      entLookup: string,
      cloudLookup: string,
      scopes: string[],
    ): Promise<string> => {
      const response = await fetch(
        this.loadClientUrl(
          `${entLookup}/azure/${cloudLookup}/auth-token?scope=${
            scopes.join(
              ",",
            )
          }`,
        ),
        {
          method: "GET",
          headers: this.loadHeaders(),
        },
      );

      return await this.json(response, "");
    },

    EnsureProviders: async (
      entLookup: string,
      cloudLookup: string,
      svcDefs: EaCServiceDefinitions,
    ): Promise<{
      Locations: Location[];
    }> => {
      const response = await fetch(
        this.loadClientUrl(`${entLookup}/azure/${cloudLookup}/providers`),
        {
          method: "POST",
          headers: this.loadHeaders(),
          body: JSON.stringify(svcDefs),
        },
      );

      return await this.json(response);
    },

    Locations: async (
      entLookup: string,
      cloudLookup: string,
      svcDefs: EaCServiceDefinitions,
    ): Promise<{
      Locations: Location[];
    }> => {
      const response = await fetch(
        this.loadClientUrl(`${entLookup}/azure/${cloudLookup}/locations`),
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
      entLookup: string,
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
          `${entLookup}/azure/${cloudLookup}/${resGroupLookup}/${res}/data-lake/${fileSystem}?${query}`,
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
      entLookup: string,
      cloudLookup: string,
      resGroupLookup: string,
      resLookups: string[],
      db: string,
      request: ExplorerRequest,
    ): Promise<KustoResponseDataSet> => {
      const res = resLookups.join("|");

      const response = await fetch(
        this.loadClientUrl(
          `${entLookup}/azure/${cloudLookup}/${resGroupLookup}/${res}/explorer/${db}`,
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
