import {
  EaCCloudResourceAsCode,
  EaCCloudResourceFormatDetails,
  EaCCloudWithResources,
  EverythingAsCodeClouds,
  TokenCredential,
} from "./.deps.ts";
import {
  Client as KustoClient,
  KustoConnectionStringBuilder,
} from "npm:azure-kusto-data@6.0.2";
import { loadAzureCloudCredentials } from "./loadAzureCloudCredentials.ts";

const kustoClientCache: Record<string, KustoClient> = {};

/**
 * Loads a Kusto client for the given cluster and region.
 *
 * @param entLookup The enterprise lookup for the Kusto cluster.
 * @param cloudLookup The cloud lookup for the Kusto cluster.
 * @param resGroupLookup The resource group lookup for the Kusto cluster.
 * @param resLookups The resource lookups for the Kusto cluster.
 * @param loadEaC The function to load Everything As Code for the Kusto cluster.
 * @param svcSuffix (optional) The service suffix for the Kusto cluster.
 * @returns A Promise that resolves to the Kusto client.
 */
export function loadKustoClient(
  entLookup: string,
  cloudLookup: string,
  resGroupLookup: string,
  resLookups: string[],
  loadEaC: (entLookup: string) => Promise<EverythingAsCodeClouds>,
  svcSuffix?: string,
): Promise<KustoClient>;

/**
 * Loads a Kusto client for the given cluster and region.
 *
 * @param cluster The Kusto cluster.
 * @param region The Kusto region.
 * @param creds The authentication credentials to use for the Kusto cluster.
 * @returns A Promise that resolves to the Kusto client.
 */
export function loadKustoClient(
  cluster: string,
  region: string,
  creds: TokenCredential,
): Promise<KustoClient>;

/**
 * Loads a Kusto client for the given cluster and region.
 *
 * @returns A Promise that resolves to the Kusto client.
 */
export async function loadKustoClient(
  clusterEntLookup: string,
  regionCloudLookup: string,
  credsResGroupLookup: TokenCredential | string,
  resLookups?: string[],
  loadEaC?: (entLookup: string) => Promise<EverythingAsCodeClouds>,
  svcSuffix?: string,
): Promise<KustoClient> {
  let [cluster, region, creds] = [
    clusterEntLookup,
    regionCloudLookup,
    credsResGroupLookup as TokenCredential,
  ];

  let clusterConectionString = "";

  if (typeof credsResGroupLookup === "string") {
    clusterConectionString =
      `${clusterEntLookup}|${regionCloudLookup}|${credsResGroupLookup as string}|${
        resLookups?.join("-")
      }`;
  } else {
    clusterConectionString = `https://${cluster}.${region}.kusto.windows.net`;
  }

  if (!(clusterConectionString in kustoClientCache)) {
    if (typeof credsResGroupLookup === "string") {
      // Received enterprise lookup and cloud lookup to consruct
      const [entLookup, cloudLookup, resGroupLookup] = [
        clusterEntLookup,
        regionCloudLookup,
        credsResGroupLookup as string,
      ];

      const eac = await loadEaC!(entLookup);

      creds = await loadAzureCloudCredentials(eac, cloudLookup);

      const cloud = eac.Clouds![cloudLookup];

      const resGroup = cloud.ResourceGroups![resGroupLookup];

      const resource = resLookups?.reduce((prev, resLookup) => {
        const res = prev.Resources![resLookup];

        return res;
      }, resGroup as EaCCloudWithResources) as EaCCloudResourceAsCode;

      const resDetails = resource.Details! as EaCCloudResourceFormatDetails;

      region = resDetails.Data!.Location as string;

      const shortName = resDetails.Data!.ShortName as string;

      if (!svcSuffix) {
        svcSuffix = `-data-explorer`;
      }

      cluster = `${shortName}${svcSuffix}`;

      clusterConectionString = `https://${cluster}.${region}.kusto.windows.net`;
    }

    const kcs = KustoConnectionStringBuilder.withTokenCredential(
      clusterConectionString,
      creds,
    );

    kustoClientCache[clusterConectionString] = new KustoClient(kcs);
  }

  return kustoClientCache[clusterConectionString];
}

export const TEMP = "Hello";
