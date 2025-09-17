import {
  type AccessToken,
  type AuthenticationProvider,
  type AuthenticationProviderOptions,
  type TokenCredential,
} from "../.deps.ts";

export class TokenProvider implements AuthenticationProvider {
  constructor(
    protected credential: TokenCredential,
    protected authenticationProviderOptions: AuthenticationProviderOptions,
  ) {}

  public async getAccessToken(): Promise<string> {
    const scopes = this.authenticationProviderOptions?.scopes ?? [
      `https://graph.microsoft.com/.default`,
    ];

    const accessToken = await this.credential.getToken(scopes);

    if (!accessToken?.token) {
      throw new Error(
        "Failed to acquire Microsoft Graph access token with the provided credential.",
      );
    }

    return accessToken.token;
  }
}
