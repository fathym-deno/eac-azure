import {
  EaCActuatorCheckResponse,
  EaCCloudAzureDetails,
  EaCRuntimeHandlers,
  ensureRoleAssignments,
  EverythingAsCodeClouds,
  loadAzureCloudCredentials,
  loadDeploymentDetails,
} from "../.deps.ts";
import { EaCCloudActuatorCheckRequest } from "../EaCCloudActuatorCheckRequest.ts";

export default {
  async POST(req, ctx) {
    debugger;
    const logger = ctx.Runtime.Logs;

    // const username = ctx.state.Username;

    const checkRequest: EaCCloudActuatorCheckRequest = await req.json();

    logger.Package.debug(
      `Processing EaC commit ${checkRequest.CommitID} Cloud checks`,
    );

    try {
      const eac = checkRequest!.EaC as EverythingAsCodeClouds;

      const currentClouds = eac.Clouds || {};

      const cloud = currentClouds[checkRequest.CloudLookup] || {};

      const deployDetails = await loadDeploymentDetails(
        logger.Package,
        checkRequest.CommitID,
        cloud,
        checkRequest.Name,
        undefined,
        checkRequest.ResourceGroupLookup,
      );

      const completeStati = ["Canceled", "Failed", "Succeeded"];

      const errorStati = ["Canceled", "Failed"];

      const complete = completeStati.some(
        (status) =>
          status === deployDetails.Deployment.properties?.provisioningState,
      );

      const hasError = errorStati.some(
        (status) =>
          status === deployDetails.Deployment.properties?.provisioningState,
      );

      if (complete && !hasError) {
        const creds = await loadAzureCloudCredentials(cloud);

        const details = cloud.Details as EaCCloudAzureDetails;

        await ensureRoleAssignments(
          creds,
          details.SubscriptionID!,
          Object.values(cloud.RoleAssignments || {}).flatMap((ras) => {
            return ras;
          }),
        );
      }

      return Response.json({
        Complete: complete,
        HasError: hasError,
        Messages: deployDetails.Messages,
      } as EaCActuatorCheckResponse);
    } catch (err) {
      logger.Package.error("There was an error checking the deployments", err);

      return Response.json({
        CorelationID: checkRequest.CorelationID,
        Complete: true,
        HasError: true,
        Messages: {
          [`Deployment: ${checkRequest.Name}`]: JSON.stringify(err),
        },
      } as EaCActuatorCheckResponse);
    }
  },
} as EaCRuntimeHandlers;
