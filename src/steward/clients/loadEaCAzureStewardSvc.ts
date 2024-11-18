import { loadJwtConfig } from "./.deps.ts";
import { EaCAzureStewardClient } from "./EaCAzureStewardClient.ts";

export async function loadEaCAzureStewardSvc(): Promise<
  EaCAzureStewardClient
>;

export async function loadEaCAzureStewardSvc(
  eacApiKey: string,
): Promise<EaCAzureStewardClient>;

export async function loadEaCAzureStewardSvc(
  entLookup: string,
  username: string,
): Promise<EaCAzureStewardClient>;

export async function loadEaCAzureStewardSvc(
  eacApiKeyEntLookup?: string,
  username?: string,
): Promise<EaCAzureStewardClient> {
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

  const eacBaseUrl = Deno.env.get("EAC_API_BASE_URL")!;

  return new EaCAzureStewardClient(
    new URL(eacBaseUrl),
    eacApiKeyEntLookup ?? "",
  );
}
