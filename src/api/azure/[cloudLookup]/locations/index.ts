import {
  EaCCloudAzureDetails,
  EaCRuntimeHandlers,
  EaCServiceDefinitions,
  EaCStewardAPIState,
  EverythingAsCodeClouds,
  loadAzureCloudCredentials,
  loadEaCStewardSvc,
  Location,
  ResourceManagementClient,
  SubscriptionClient,
} from "../../../.deps.ts";

export default {
  async POST(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup;

    const cloudLookup = ctx.Params.cloudLookup as string;

    const svcDefs: EaCServiceDefinitions = await req.json();

    const eacSvc = await loadEaCStewardSvc(entLookup, ctx.State.Username);

    const eac: EverythingAsCodeClouds = await eacSvc.EaC.Get();

    const creds = await loadAzureCloudCredentials(eac, cloudLookup);

    const locations: Location[] = [];

    if (creds) {
      const details = eac.Clouds![cloudLookup!].Details as EaCCloudAzureDetails;

      const svcDefLocations: string[] = [];

      const resClient = new ResourceManagementClient(
        creds,
        details.SubscriptionID,
      );

      for (const sd of Object.keys(svcDefs)) {
        const svcDef = svcDefs[sd];

        const provider = await resClient.providers.get(sd);

        provider.resourceTypes
          ?.filter((rt) => {
            return svcDef.Types.includes(rt.resourceType!);
          })
          .map((rt) => rt.locations!)
          .forEach((locations) => {
            svcDefLocations.push(...locations);
          });
      }

      const locationNames = Array.from(new Set(svcDefLocations));

      const subClient = new SubscriptionClient(creds);

      const subLocationsList = subClient.subscriptions.listLocations(
        details.SubscriptionID,
      );

      for await (const subLocation of subLocationsList) {
        if (
          locationNames.length === 0 ||
          locationNames.includes(subLocation.displayName!)
        ) {
          locations.push(subLocation);
        }
      }
    }

    return Response.json({
      Locations: locations,
    });
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
