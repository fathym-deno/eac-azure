import {
  deconstructCloudDetailsSecrets,
  EaCActuatorConnectionsRequest,
  EaCActuatorConnectionsResponse,
  EaCCloudAsCode,
  EaCRuntimeHandlers,
  loadCloudResourceGroupsConnections,
} from "../.deps.ts";

export default {
  async POST(req, ctx) {
    const logger = ctx.Runtime.Logs;

    const handlerRequest: EaCActuatorConnectionsRequest = await req.json();

    const cloudDef = handlerRequest.Model as EaCCloudAsCode;

    let resGroupLookups = Object.keys(cloudDef.ResourceGroups || {});

    const cloud = handlerRequest.Current as EaCCloudAsCode;

    if (resGroupLookups.length === 0) {
      resGroupLookups = Object.keys(cloud.ResourceGroups || {});
    }

    cloud.Details = await deconstructCloudDetailsSecrets(cloud.Details);

    return Response.json({
      Model: {
        ResourceGroups: await loadCloudResourceGroupsConnections(
          logger.Package,
          cloud,
          cloudDef.ResourceGroups || {},
          cloud.ResourceGroups || {},
          resGroupLookups,
        ),
      } as EaCCloudAsCode,
    } as EaCActuatorConnectionsResponse);
  },
} as EaCRuntimeHandlers;
