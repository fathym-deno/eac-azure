import { loadJwtConfig } from "./.deps.ts";
import { EaCAzureAPIClient } from "./EaCAzureAPIClient.ts";

export async function loadEaCAzureAPISvc(): Promise<EaCAzureAPIClient>;

export async function loadEaCAzureAPISvc(
  eacApiKey: string,
): Promise<EaCAzureAPIClient>;

export async function loadEaCAzureAPISvc(
  entLookup: string,
  username: string,
): Promise<EaCAzureAPIClient>;

export async function loadEaCAzureAPISvc(
  eacApiKeyEntLookup?: string,
  username?: string,
): Promise<EaCAzureAPIClient> {
  if (!eacApiKeyEntLookup) {
    eacApiKeyEntLookup = Deno.env.get("EAC_API_KEY");

    if (!eacApiKeyEntLookup) {
      eacApiKeyEntLookup = Deno.env.get("EAC_API_ENTERPRISE_LOOKUP");

      if (eacApiKeyEntLookup) {
        username = Deno.env.get("EAC_API_USERNAME");
      }
    }
  }

  if (username) {
    eacApiKeyEntLookup = await loadJwtConfig().Create(
      {
        EnterpriseLookup: eacApiKeyEntLookup,
        Username: username!,
      },
      60 * 60 * 1,
    );
  }

  const apiRoot = Deno.env.get("EaCAzureAPIClient_URL")!;

  return new EaCAzureAPIClient(
    new URL(apiRoot),
    eacApiKeyEntLookup ?? "",
  );
}
