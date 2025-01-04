import {
  EaCActuatorConnectionsRequest,
  EaCActuatorConnectionsResponse,
  eacGetSecrets,
  EaCRuntimeHandlers,
  EaCSecretAsCode,
  EverythingAsCode,
  EverythingAsCodeClouds,
  loadSecretClient,
} from "../.deps.ts";

export default {
  async POST(req, ctx) {
    const handlerRequest: EaCActuatorConnectionsRequest = await req.json();

    const eac: EverythingAsCode & EverythingAsCodeClouds = handlerRequest.EaC;

    const secretDef = handlerRequest.Model as EaCSecretAsCode;

    const secret = handlerRequest.Current as EaCSecretAsCode;

    const secretClient = await loadSecretClient(
      eac,
      secretDef.CloudLookup || secret.CloudLookup!,
      secretDef.KeyVaultLookup || secret.KeyVaultLookup!,
    );

    const secreted = await eacGetSecrets(secretClient, {
      Value: secretDef.Details?.Value || secret.Details!.Value!,
    });

    return Response.json({
      Model: {
        Details: {
          Value: secreted.Value,
        },
      } as EaCSecretAsCode,
    } as EaCActuatorConnectionsResponse);
  },
} as EaCRuntimeHandlers;
