import {
  EaCActuatorRequest,
  EaCActuatorResponse,
  EaCRuntimeHandlers,
  EaCSecretAsCode,
  eacSetSecrets,
  EaCStewardAPIState,
  EverythingAsCode,
  EverythingAsCodeClouds,
  loadSecretClient,
  merge,
  resolveDynamicValues,
} from "../.deps.ts";

export default {
  async POST(req, ctx) {
    const logger = ctx.Runtime.Logs;

    const handlerRequest: EaCActuatorRequest = await req.json();

    logger.Package.debug(
      `Processing EaC commit ${handlerRequest.CommitID} Secret processes for secret ${handlerRequest.Lookup}`,
    );

    const eac: EverythingAsCodeClouds & EverythingAsCode = handlerRequest.EaC;

    const currentSecrets = eac.Secrets || {};

    const secretLookup = handlerRequest.Lookup;

    const current = currentSecrets[secretLookup] || {};

    const secretDef = handlerRequest.Model as EaCSecretAsCode;

    let secretValue = secretDef.Details?.Value;

    if (secretValue && !secretValue.startsWith("$secret:")) {
      const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, "eac");

      const resolved = await resolveDynamicValues(
        eacKv,
        {
          SecretValue: secretValue,
        },
        eac,
        ctx.State.JWT!,
      );

      secretValue = resolved.SecretValue;

      const secretClient = await loadSecretClient(
        eac,
        secretDef.CloudLookup || current.CloudLookup!,
        secretDef.KeyVaultLookup || current.KeyVaultLookup!,
      );

      const secreted = await eacSetSecrets(secretClient, secretLookup, {
        Value: secretValue,
      });

      secretDef.Details = merge(current.Details!, {
        Value: secreted.Value,
      });
    }

    return Response.json({
      Checks: [],
      Lookup: secretLookup,
      Messages: {
        Message: `The secret '${secretLookup}' has been handled.`,
      },
      Model: secretDef,
    } as EaCActuatorResponse);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
