import {
  EverythingAsCodeClouds,
  isEverythingAsCodeClouds,
  KeyClient,
  SecretClient,
  TokenCredential,
} from "./.deps.ts";
import {
  loadAzureCloudCredentials,
  loadMainAzureCredentials,
} from "./loadAzureCloudCredentials.ts";

/**
 * Loads the KeyClient instance.
 *
 * @param eac The EaC cloud configuration.
 * @param cloudLookup The cloud lookup to use.
 * @param keyVaultLookup The key vault lookup to use.
 * @returns A KeyClient instance.
 */
export async function loadKeyClient(
  eac: EverythingAsCodeClouds,
  cloudLookup: string,
  keyVaultLookup: string,
): Promise<KeyClient>;

/**
 * Loads the KeyClient instance.
 *
 * @param creds The credentials to use.
 * @param keyVaultLookup The key vault lookup to use.
 * @returns A KeyClient instance.
 */
export async function loadKeyClient(
  creds: TokenCredential,
  keyVaultLookup: string,
): Promise<KeyClient>;

/**
 * Loads the KeyClient instance.
 *
 * @returns A KeyClient instance.
 */
export async function loadKeyClient(
  credsEaC: TokenCredential | EverythingAsCodeClouds,
  keyVaultCloudLookup: string,
  keyVaultLookup?: string,
): Promise<KeyClient> {
  const { creds, url } = await loadKeyVaultUrlAndCreds(
    credsEaC,
    keyVaultCloudLookup,
    keyVaultLookup,
  );

  return new KeyClient(url, creds);
}

/**
 * Loads the KeyClient instance for the main Azure account.
 *
 * @param keyVaultLookup The key vault lookup to use.
 * @returns A KeyClient instance.
 */
export async function loadMainKeyClient(
  keyVaultLookup: string,
): Promise<KeyClient> {
  const creds = loadMainAzureCredentials();

  return await loadKeyClient(creds, keyVaultLookup);
}

/**
 * Loads the SecretClient instance.
 *
 * @param eac The EaC cloud configuration.
 * @param cloudLookup The cloud lookup to use.
 * @param keyVaultLookup The key vault lookup to use.
 * @returns A SecretClient instance.
 */
export async function loadSecretClient(
  eac: EverythingAsCodeClouds,
  cloudLookup: string,
  keyVaultLookup: string,
): Promise<SecretClient>;

/**
 * Loads the SecretClient instance.
 *
 * @param creds The credentials to use.
 * @param keyVaultLookup The key vault lookup to use.
 * @returns A SecretClient instance.
 */
export async function loadSecretClient(
  creds: TokenCredential,
  keyVaultLookup: string,
): Promise<SecretClient>;

/**
 * Loads the SecretClient instance.
 *
 * @returns
 */
export async function loadSecretClient(
  credsEaC: TokenCredential | EverythingAsCodeClouds,
  keyVaultCloudLookup: string,
  keyVaultLookup?: string,
): Promise<SecretClient> {
  const { creds, url } = await loadKeyVaultUrlAndCreds(
    credsEaC,
    keyVaultCloudLookup,
    keyVaultLookup,
  );

  return new SecretClient(url, creds);
}

/**
 * Loads the SecretClient instance for the main Azure account.
 */
export async function loadMainSecretClient(): Promise<SecretClient>;

/**
 * Loads the SecretClient instance for the main Azure account.
 *
 * @param keyVaultLookup The key vault lookup to use.
 * @returns A SecretClient instance.
 */
export async function loadMainSecretClient(
  keyVaultLookup?: string,
): Promise<SecretClient> {
  if (!keyVaultLookup) {
    keyVaultLookup = Deno.env.get("AZURE_KEY_VAULT_NAME")!;
  }

  const creds = loadMainAzureCredentials();

  return await loadSecretClient(creds, keyVaultLookup);
}

/**
 * Loads the KeyVault URL and credentials.
 *
 * @returns The KeyVault URL and credentials.
 */
export async function loadKeyVaultUrlAndCreds(
  credsEaC: TokenCredential | EverythingAsCodeClouds,
  keyVaultCloudLookup: string,
  keyVaultLookup?: string,
): Promise<{
  creds: TokenCredential;

  url: string;
}> {
  let creds: TokenCredential | undefined;

  if (isEverythingAsCodeClouds(credsEaC)) {
    creds = await loadAzureCloudCredentials(credsEaC, keyVaultCloudLookup);
  } else {
    creds = credsEaC;
  }

  if (!keyVaultLookup) {
    keyVaultLookup = keyVaultCloudLookup;
  }

  const url = `https://${keyVaultLookup}.vault.azure.net/`;

  return { creds, url };
}
