import {
  type EaCCloudAzureDetails,
  type EaCCloudDetails,
  isEaCCloudAzureDetails,
} from "./.deps.ts";
import { eacGetSecrets } from "./eacGetSecrets.ts";
import { loadMainSecretClient } from "./key-vault.ts";

/**
 * This function deconstructs the provided cloud details by fetching the secrets from Azure Key Vault.
 *
 * @param details The cloud details to deconstruct.
 * @returns The deconstructed cloud details with secrets.
 */
export async function deconstructCloudDetailsSecrets(
  details: EaCCloudDetails | undefined,
): Promise<EaCCloudDetails | undefined> {
  let cloudDetails = details;

  if (details) {
    const secretClient = await loadMainSecretClient();

    if (isEaCCloudAzureDetails(cloudDetails)) {
      const secreted = await eacGetSecrets(secretClient, {
        AuthKey: cloudDetails.AuthKey,
      });

      cloudDetails = {
        ...details,
        ...secreted,
      } as EaCCloudAzureDetails;
    }
  }

  return cloudDetails;
}
