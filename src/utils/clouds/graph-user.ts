import {
  type AccessToken,
  GraphClient,
  type TokenCredential,
  type User,
} from "../.deps.ts";
import { TokenProvider } from "./token-provider.ts";

export async function getCurrentAzureUser(accessToken: string): Promise<User> {
  const graphClient = GraphClient.initWithMiddleware({
    authProvider: new TokenProvider(
      {
        getToken: (_scopes) => {
          return Promise.resolve({
            token: accessToken,
            expiresOnTimestamp: Date.now() + 5 * 60 * 1000,
          } as AccessToken);
        },
      } as TokenCredential,
      {
        scopes: [`https://graph.microsoft.com/.default`],
      },
    ),
  });

  const me = await graphClient.api("/me").get() as User;

  return me;
}
