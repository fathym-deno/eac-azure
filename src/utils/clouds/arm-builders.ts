import {
  type Deployment,
  type EaCCloudAsCode,
  type EaCCloudDeployment,
  type EaCCloudResourceAsCode,
  type EaCCloudResourceFormatDetails,
  type EaCCloudResourceGroupAsCode,
  type EaCCloudResourceGroupDetails,
  type EverythingAsCodeClouds,
  type Logger,
} from "../.deps.ts";
import {
  formatParameters,
  loadCloudResourceDetailAssets,
} from "./resource-assets.ts";

export async function buildCloudDeployments(
  logger: Logger,
  commitId: string,
  eac: EverythingAsCodeClouds,
  cloudLookup: string,
  cloud: EaCCloudAsCode,
): Promise<EaCCloudDeployment[]> {
  logger.debug(`Building EaC commit ${commitId} Cloud deloyments`);

  const resGroupLookups = Object.keys(cloud.ResourceGroups || {});
  const deployments: EaCCloudDeployment[] = [];

  for (const resGroupLookup of resGroupLookups) {
    const resGroup = cloud.ResourceGroups![resGroupLookup];

    const deployment = await buildCloudDeployment(
      logger,
      commitId,
      eac,
      cloudLookup,
      resGroupLookup,
      resGroup,
    );

    if (deployment) {
      deployments.push(deployment);
    }
  }

  return deployments;
}

export async function buildCloudDeployment(
  logger: Logger,
  commitId: string,
  eac: EverythingAsCodeClouds,
  cloudLookup: string,
  resGroupLookup: string,
  resGroup: EaCCloudResourceGroupAsCode,
): Promise<EaCCloudDeployment | undefined> {
  if (Object.keys(resGroup.Resources || {}).length > 0) {
    logger.debug(
      `Building EaC commit ${commitId} Cloud deployment for ${resGroupLookup}`,
    );

    const resGroupTemplateResources: Record<string, unknown>[] = [];

    const useResGroupDetails = resGroup.Details ||
      eac.Clouds![cloudLookup].ResourceGroups![resGroupLookup].Details;

    const armResources = await buildArmResourcesForResourceGroupDeployment(
      useResGroupDetails!,
      cloudLookup,
      resGroupLookup,
      resGroup,
    );

    resGroupTemplateResources.push(...armResources);

    const deploymentName = `resource-group-${resGroupLookup}-${Date.now()}`;

    const deployment: Deployment = {
      location: useResGroupDetails!.Location,
      properties: {
        mode: "Incremental",
        expressionEvaluationOptions: {
          scope: "outer",
        },
        template: {
          $schema:
            "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
          contentVersion: "1.0.0.0",
          resources: resGroupTemplateResources,
        },
      },
      tags: {
        Cloud: cloudLookup,
      },
    };

    return {
      CloudLookup: cloudLookup,
      Deployment: deployment,
      Name: deploymentName,
      ResourceGroupLookup: resGroupLookup,
    } as EaCCloudDeployment;
  }

  return undefined;
}

export async function buildArmResourcesForResourceGroupDeployment(
  useResGroupDetails: EaCCloudResourceGroupDetails,
  cloudLookup: string,
  resGroupLookup: string,
  resGroup: EaCCloudResourceGroupAsCode,
): Promise<Record<string, unknown>[]> {
  const armResources: Record<string, unknown>[] = [];

  armResources.push({
    type: "Microsoft.Resources/resourceGroups",
    apiVersion: "2018-05-01",
    name: resGroupLookup,
    location: useResGroupDetails.Location,
    tags: { Cloud: cloudLookup },
  });

  const resourceArmResources = await buildArmResourcesForResources(
    cloudLookup,
    resGroupLookup,
    resGroup.Resources || {},
    [`[resourceId('Microsoft.Resources/resourceGroups', '${resGroupLookup}')]`],
  );

  armResources.push(...resourceArmResources);
  return armResources;
}

export async function buildArmResourcesForResources(
  cloudLookup: string,
  resGroupLookup: string,
  resources: Record<string, EaCCloudResourceAsCode>,
  dependsOn: string[],
): Promise<Record<string, unknown>[]> {
  const resLookups = Object.keys(resources);
  const armResources: Record<string, unknown>[] = [];
  for (const resLookup of resLookups) {
    const resource = resources[resLookup];
    const resArmResource = await buildResourceTemplateResource(
      cloudLookup,
      resGroupLookup,
      resLookup,
      resource,
      dependsOn,
    );
    armResources.push(resArmResource);
  }
  return armResources;
}

export async function buildResourceTemplateResource(
  cloudLookup: string,
  resGroupLookup: string,
  resLookup: string,
  resource: EaCCloudResourceAsCode,
  dependsOn: string[],
): Promise<Record<string, unknown>> {
  const details = resource.Details as EaCCloudResourceFormatDetails;
  const assets = await loadCloudResourceDetailAssets(details);
  const deploymentName = `resource-${resLookup}-${Date.now()}`;

  type InnerTemplate = Record<string, unknown>;
  type ArmDeploymentResource = {
    type: string;
    apiVersion: string;
    dependsOn: string[];
    resourceGroup: string;
    name: string;
    properties: {
      mode: string;
      expressionEvaluationOptions: { scope: string };
      parameters: Record<string, unknown>;
      template: InnerTemplate;
    };
    tags: Record<string, string>;
  };

  const armResource: ArmDeploymentResource = {
    type: "Microsoft.Resources/deployments",
    apiVersion: "2019-10-01",
    dependsOn: dependsOn,
    resourceGroup: resGroupLookup,
    name: deploymentName,
    properties: {
      mode: "Incremental",
      expressionEvaluationOptions: { scope: "inner" },
      parameters: formatParameters(details.Data || {}, assets.Parameters),
      template: { ...assets.Content },
    },
    tags: { Cloud: cloudLookup },
  };

  const templateObj = armResource.properties.template as {
    resources?: Record<string, unknown>[];
  };
  templateObj.resources ??= [];
  const peerResources = templateObj.resources;

  if (resource.Resources) {
    const subResArmResources = await buildArmResourcesForResources(
      cloudLookup,
      resGroupLookup,
      resource.Resources || {},
      peerResources.map((pr) => {
        const typed = pr as { name: unknown; type: string };
        let name = String(typed.name);
        if (name.startsWith("[")) {
          name = name.substring(1, name.length - 1);
        } else {
          name = `'${name}'`;
        }
        return `[resourceId('${typed.type}', ${name})]`;
      }),
    );
    peerResources.push(...subResArmResources);
  }

  return armResource;
}
