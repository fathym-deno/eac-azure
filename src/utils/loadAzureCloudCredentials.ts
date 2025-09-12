import {
  AccessToken,
  ClientSecretCredential,
  ConfidentialClientApplication,
  EaCCloudAsCode,
  EaCCloudAzureDetails,
  EaCCloudDetails,
  EverythingAsCode,
  EverythingAsCodeClouds,
  isEaCCloudAsCode,
  TokenCredential,
} from "./.deps.ts";
import { deconstructCloudDetailsSecrets } from "./deconstructCloudDetailsSecrets.ts";

/**
 * Load Azure credentials from the provided token.
 *
 * @param token Azure access token.
 * @returns Azure credentials based on the provided token.
 */
export async function loadAzureCredentialsForToken(
  token: string,
): Promise<TokenCredential> {
  return {
    getToken: () => {
      return Promise.resolve({
        token: token,
      } as AccessToken);
    },
  };
}

/**
 * Load Azure credentials from the provided client secret and tenant ID.
 *
 * @param idToken Azure ID token.
 * @param clientId Azure client ID.
 * @param clientSecret Azure client secret.
 * @param scopes Azure scopes.
 * @param tenantId Azure tenant ID (optional, defaults to "common").
 * @returns Azure credentials based on the provided ID token.
 */
export async function loadAzureCredentialsForIDToken(
  idToken: string,
  clientId: string,
  clientSecret: string,
  scopes: string[],
  tenantId: string = "common",
): Promise<TokenCredential> {
  const cca = new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  });

  const authResult = await cca.acquireTokenOnBehalfOf({
    oboAssertion: idToken,
    scopes: scopes,
  });

  if (authResult?.accessToken) {
    return {
      getToken: () => {
        return Promise.resolve({
          token: authResult.accessToken,
        } as AccessToken);
      },
    };
  } else {
    throw new Error("Failed to obtain access token");
  }
}

/**
 * Load Azure credentials from the provided cloud.
 *
 * @param entLookup The enterprise lookup.
 * @param cloudLookup The cloud lookup.
 * @param loadEac The loadEac function.
 * @returns Azure credentials for the specified cloud.
 */
export async function loadAzureCloudCredentials(
  entLookup: string,
  cloudLookup: string,
  loadEac: (entLookup: string) => Promise<EverythingAsCode>,
): Promise<TokenCredential>;

/**
 * Load Azure credentials from the provided cloud.
 *
 * @param eac The EverythingAsCode instance to lookup the cloud from.
 * @param cloudLookup The cloud lookup.
 * @returns Azure credentials for the specified cloud.
 */
export async function loadAzureCloudCredentials(
  eac: EverythingAsCodeClouds,
  cloudLookup: string,
): Promise<TokenCredential>;

/**
 * Load Azure credentials from the provided cloud.
 *
 * @param cloud The EaC cloud to load credentials for.
 * @returns Azure credentials for the specified cloud.
 */
export async function loadAzureCloudCredentials(
  cloud: EaCCloudAsCode,
): Promise<TokenCredential>;

/**
 * Load Azure credentials from the provided cloud details.
 *
 * @param cloudDetails The cloud details.
 * @returns Azure credentials for the specified cloud.
 */
export async function loadAzureCloudCredentials(
  cloudDetails: EaCCloudDetails,
): Promise<TokenCredential>;

/**
 * Load Azure credentials from the provided cloud details.
 *
 * @returns Azure credentials for the specified cloud.
 */
export async function loadAzureCloudCredentials(
  cloudDetailsEaCEntLookup:
    | EverythingAsCodeClouds
    | EaCCloudAsCode
    | EaCCloudDetails
    | string,
  cloudLookup?: string,
  loadEaC?: (entLookup: string) => Promise<EverythingAsCode>,
): Promise<TokenCredential> {
  let cloud: EaCCloudAsCode;

  if (cloudLookup) {
    let eac: EverythingAsCodeClouds;

    if (typeof cloudDetailsEaCEntLookup === "string") {
      eac = (await loadEaC!(
        cloudDetailsEaCEntLookup,
      )) as EverythingAsCodeClouds;
    } else {
      eac = cloudDetailsEaCEntLookup as EverythingAsCodeClouds;
    }

    cloud = eac.Clouds![cloudLookup];
  } else if (isEaCCloudAsCode(cloudDetailsEaCEntLookup)) {
    cloud = cloudDetailsEaCEntLookup as EaCCloudAsCode;
  } else {
    cloud = {
      Details: cloudDetailsEaCEntLookup as EaCCloudDetails,
    };
  }

  if ("Token" in cloud && cloud.Token) {
    return loadAzureCredentialsForToken(cloud.Token as string);
  } else {
    const details = (await deconstructCloudDetailsSecrets(
      cloud.Details,
    )) as EaCCloudAzureDetails;

    return new ClientSecretCredential(
      details.TenantID,
      details.ApplicationID,
      details.AuthKey,
    );
  }
}

/**
 * Load the main Azure credentials from environment variables.
 *
 * @returns Azure credentials for the main Azure tenant.
 */
export function loadMainAzureCredentials(): ClientSecretCredential {
  return new ClientSecretCredential(
    Deno.env.get("AZURE_TENANT_ID")!,
    Deno.env.get("AZURE_CLIENT_ID")!,
    Deno.env.get("AZURE_CLIENT_SECRET")!,
  );
}
