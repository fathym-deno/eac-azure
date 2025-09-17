import {
  type Deployment,
  type DeploymentExtended,
  type EaCActuatorCheckRequest,
  type EaCCloudAsCode,
  EaCCloudAzureDetails,
  type Logger,
  merge,
  ResourceManagementClient,
} from "../.deps.ts";
import { loadAzureCloudCredentials } from "../loadAzureCloudCredentials.ts";

export async function beginEaCDeployments(
  logger: Logger,
  commitId: string,
  cloud: EaCCloudAsCode,
  deployments: {
    Name: string;
    Deployment: Deployment;
    ResourceGroupLookup?: string;
  }[],
): Promise<EaCActuatorCheckRequest[]> {
  logger.debug(`Beginning EaC commit ${commitId} Cloud deloyments`);

  const details = cloud.Details as EaCCloudAzureDetails;
  const creds = await loadAzureCloudCredentials(cloud);
  const resClient = new ResourceManagementClient(creds, details.SubscriptionID);

  const beginDeploymentCalls = deployments.map(async (deployment) => {
    const _beginDeploy = await resClient.deployments
      .beginCreateOrUpdateAtSubscriptionScope(
        deployment.Name,
        deployment.Deployment,
      );

    return {
      CommitID: commitId,
      CorelationID: crypto.randomUUID(),
      ...deployment,
    } as EaCActuatorCheckRequest;
  });

  const checks = await Promise.all(beginDeploymentCalls);
  return checks;
}

export async function loadDeploymentDetails(
  logger: Logger,
  commitId: string,
  cloud: EaCCloudAsCode,
  deploymentName: string,
  resGroupLookup?: string,
  resGroupLookupPassthrough?: string,
): Promise<{
  Deployment: DeploymentExtended;
  Messages: Record<string, unknown>;
}> {
  logger.debug(
    `Processing EaC commit ${commitId} Cloud checks for deployment ${deploymentName}`,
  );

  const details = cloud.Details as EaCCloudAzureDetails;
  const creds = await loadAzureCloudCredentials(cloud);
  const resClient = new ResourceManagementClient(creds, details.SubscriptionID);

  const getDeployment = resGroupLookup
    ? resClient.deployments.get(resGroupLookup, deploymentName)
    : resClient.deployments.getAtSubscriptionScope(deploymentName);

  const deployment = await getDeployment;

  const list = resGroupLookup
    ? resClient.deploymentOperations.list(resGroupLookup, deploymentName)
    : resClient.deploymentOperations.listAtSubscriptionScope(deploymentName);

  const ops = await list;

  const messages: Record<string, unknown> = {
    [deploymentName]: {
      LastActivity: deployment.properties!.timestamp,
      State: deployment.properties!.provisioningState,
    },
  };

  for await (const operation of ops) {
    const nextResource = operation.properties!.targetResource?.resourceName!;
    if (
      operation.properties?.targetResource?.resourceType ===
        "Microsoft.Resources/deployments"
    ) {
      const subDeployDetails = await loadDeploymentDetails(
        logger,
        commitId,
        cloud,
        nextResource,
        resGroupLookupPassthrough,
        resGroupLookupPassthrough,
      );
      messages[deploymentName] = merge(
        messages[deploymentName] as object,
        subDeployDetails.Messages,
      );
    } else if (nextResource) {
      messages[deploymentName] = merge(messages[deploymentName] as object, {
        [nextResource]: {
          LastActivity: operation.properties!.timestamp,
          Message: operation.properties!.statusMessage,
          Operation: operation.properties!.provisioningOperation,
          State: operation.properties!.provisioningState,
          Status: operation.properties!.statusCode,
          Type: operation.properties!.targetResource?.resourceType,
        },
      });
    }
  }

  return { Deployment: deployment, Messages: messages };
}
