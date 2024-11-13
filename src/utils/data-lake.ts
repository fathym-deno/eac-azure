import {
  DataLakeServiceClient,
  EaCCloudResourceAsCode,
  EaCCloudResourceFormatDetails,
  EaCCloudWithResources,
  EverythingAsCodeClouds,
  TokenCredential,
} from "./.deps.ts";
import { loadAzureCloudCredentials } from "./loadAzureCloudCredentials.ts";

const dataLakeClientCache: Record<string, DataLakeServiceClient> = {};

/**
 * Loads a Data Lake client for the given account and credentials.
 *
 * @param account The Data Lake account to connect to.
 * @param creds The authentication credentials to use for the Data Lake account.
 * @returns A Promise that resolves to the Data Lake client.
 */
export function loadDataLakeClient(
  account: string,
  creds: TokenCredential,
): Promise<DataLakeServiceClient>;

/**
 * Loads a Data Lake client for the given account, credentials, and resource group.
 *
 * @param entLookup The enterprise lookup for the Data Lake account.
 * @param cloudLookup The cloud lookup for the Data Lake account.
 * @param resGroupLookup The resource group lookup for the Data Lake account.
 * @param resLookups The resource lookups for the Data Lake account.
 * @param loadEaC The function to load Everything As Code for the Data Lake account.
 * @param svcSuffix (optional) The service suffix for the Data Lake account.
 * @returns A Promise that resolves to the Data Lake client.
 */
export function loadDataLakeClient(
  entLookup: string,
  cloudLookup: string,
  resGroupLookup: string,
  resLookups: string[],
  loadEaC: (entLookup: string) => Promise<EverythingAsCodeClouds>,
  svcSuffix?: string,
): Promise<DataLakeServiceClient>;

/**
 * Loads a Data Lake client for the given account, credentials, and resource group.
 *
 * @returns A Promise that resolves to the Data Lake client.
 */
export async function loadDataLakeClient(
  accountEntLookup: string,
  credsCloudLookup: TokenCredential | string,
  resGroupLookup?: string,
  resLookups?: string[],
  loadEaC?: (entLookup: string) => Promise<EverythingAsCodeClouds>,
  svcSuffix?: string,
): Promise<DataLakeServiceClient> {
  let [account, creds] = [
    accountEntLookup,
    credsCloudLookup as TokenCredential,
  ];

  let svcClientUrl = "";

  if (typeof credsCloudLookup === "string") {
    svcClientUrl = `${accountEntLookup}|${credsCloudLookup as string}|${
      resLookups?.join("-")
    }`;
  } else {
    svcClientUrl = `https://${account}.dfs.core.windows.net`;
  }

  if (!(svcClientUrl in dataLakeClientCache)) {
    if (typeof credsCloudLookup === "string") {
      // Received enterprise lookup and cloud lookup to consruct
      const [entLookup, cloudLookup] = [
        accountEntLookup,
        credsCloudLookup as string,
      ];

      const eac = await loadEaC!(entLookup);

      creds = await loadAzureCloudCredentials(eac, cloudLookup);

      const cloud = eac.Clouds![cloudLookup];

      const resGroup = cloud.ResourceGroups![resGroupLookup!];

      const resource = resLookups?.reduce((prev, resLookup) => {
        const res = prev.Resources![resLookup];

        return res;
      }, resGroup as EaCCloudWithResources) as EaCCloudResourceAsCode;

      const resDetails = resource.Details! as EaCCloudResourceFormatDetails;

      const shortName = resDetails.Data!.ShortName as string;

      if (!svcSuffix) {
        svcSuffix = `datalake`;
      }

      account = `${shortName}${svcSuffix}`;

      svcClientUrl = `https://${account}.dfs.core.windows.net`;
    }

    dataLakeClientCache[svcClientUrl] = new DataLakeServiceClient(
      svcClientUrl,
      creds,
    );
  }

  return dataLakeClientCache[svcClientUrl];
}
