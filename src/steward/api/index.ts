import {
  beginEaCDeployments,
  buildCloudDeployments,
  EaCActuatorCheckRequest,
  EaCActuatorErrorResponse,
  EaCActuatorRequest,
  EaCActuatorResponse,
  EaCCloudAsCode,
  EaCCloudAzureDetails,
  EaCRuntimeHandlers,
  eacSetSecrets,
  EverythingAsCode,
  EverythingAsCodeClouds,
  finalizeCloudDetails,
  isEaCCloudAzureDetails,
  loadMainSecretClient,
} from "./.deps.ts";

export default {
  async POST(req, ctx) {
    const logger = ctx.Runtime.Logs;

    try {
      // const username = ctx.state.Username;

      const handlerRequest: EaCActuatorRequest = await req.json();

      logger.Package.debug(
        `Processing EaC commit ${handlerRequest.CommitID} Cloud processes for cloud ${handlerRequest.Lookup}`,
      );

      const eac = handlerRequest.EaC as
        & EverythingAsCode
        & EverythingAsCodeClouds;

      const currentClouds = eac.Clouds || {};

      const cloudLookup = handlerRequest.Lookup;

      const current = currentClouds[cloudLookup] || {};

      const cloud = handlerRequest.Model as EaCCloudAsCode;

      await finalizeCloudDetails(
        logger.Package,
        eac.EnterpriseLookup!,
        cloudLookup,
        handlerRequest.CommitID,
        cloud,
      );

      const deployments = await buildCloudDeployments(
        logger.Package,
        handlerRequest.CommitID,
        eac,
        cloudLookup,
        cloud,
      );

      const checks: EaCActuatorCheckRequest[] = await beginEaCDeployments(
        logger.Package,
        handlerRequest.CommitID,
        cloud.Details ? cloud : current,
        deployments,
      );

      const secretClient = await loadMainSecretClient();

      const secretRoot = `cloud-${cloudLookup}`;

      const cloudDetails = cloud.Details;

      if (
        isEaCCloudAzureDetails(cloudDetails) &&
        !cloudDetails.AuthKey.startsWith("$secret:")
      ) {
        const secreted = await eacSetSecrets(secretClient, secretRoot, {
          AuthKey: cloudDetails.AuthKey,
        });

        cloud.Details = {
          ...cloud.Details,
          ...secreted,
        } as EaCCloudAzureDetails;
      }

      return Response.json({
        Checks: checks,
        Lookup: cloudLookup,
        Messages: {
          Message: `The cloud '${cloudLookup}' has been handled.`,
        },
        Model: cloud,
      } as EaCActuatorResponse);
    } catch (err) {
      logger.Package.error(
        "There was an error starting the cloud deployments",
        err,
      );

      return Response.json({
        HasError: true,
        Messages: {
          Error: JSON.stringify(err),
        },
      } as EaCActuatorErrorResponse);
    }
  },
} as EaCRuntimeHandlers;
