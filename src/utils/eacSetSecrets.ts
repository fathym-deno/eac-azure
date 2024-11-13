import { getPackageLogger, kebabCase, SecretClient } from "./.deps.ts";

/**
 * Set Azure Key Vault secrets.
 *
 * @param secretClient The Azure Key Vault secret client.
 * @param secretRoot The Azure Key Vault secret root.
 * @param toSecrets The secrets to be set.
 * @returns A promise that resolves to the secrets set.
 */
export async function eacSetSecrets(
  secretClient: SecretClient,
  secretRoot: string,
  toSecrets: Record<string, string | undefined>,
): Promise<Record<string, string>> {
  const logger = await getPackageLogger(import.meta);

  const secreted: Record<string, string> = {};

  const secrets = Object.keys(toSecrets || {});

  const calls = secrets.map((secret) => {
    return new Promise((resolve, reject) => {
      const secretName = secretRoot
        ? kebabCase(`${secretRoot}-${secret}`)
        : kebabCase(secret);

      let toSecret = toSecrets[secret];

      if (toSecret && !toSecret.startsWith("$secret:")) {
        try {
          secretClient
            .setSecret(secretName, toSecret as string)
            .then((response) => {
              secreted[secret] = `$secret:${secretName}`;

              resolve(secreted[secret]);
            });
        } catch (err) {
          logger.error("There was an issue saving your secrets.", err);
        }
      } else {
        resolve(toSecret);
      }
    });
  });

  await Promise.all(calls);

  return secreted;
}
