import {
  BillingAccount,
  BillingManagementClient,
  EaCRuntimeHandlers,
  EaCStewardAPIState,
  loadAzureCredentialsForToken,
} from "../../.deps.ts";

export default {
  async GET(req, ctx) {
    const azureAccessToken = req.headers.get("x-eac-azure-access-token")!;

    const creds = await loadAzureCredentialsForToken(azureAccessToken);

    const scopes: Record<string, string> = {};

    if (creds) {
      try {
        const subscriptionId = "00000000-0000-0000-0000-000000000000";

        const billingClient = new BillingManagementClient(
          creds,
          subscriptionId,
        );

        const expandProps = [
          "billingProfiles",
          "billingProfiles/invoiceSections",
          "customers",
          "enrollmentAccounts",
        ];

        const billingAccountsList = billingClient.billingAccounts.list({
          expand: expandProps.join(","),
        });

        for await (const ba of billingAccountsList) {
          const acct = ba as BillingAccount;
          const properties = acct.properties ?? {};
          const agreementType = (properties as { agreementType?: string })
            .agreementType;
          const accountName =
            (properties as { displayName?: string }).displayName ||
            acct.name ||
            "Billing Account";

          switch (agreementType) {
            case "MicrosoftOnlineServicesProgram": {
              // MOSP: use the billing account id directly
              if (acct.id) {
                scopes[acct.id] = `MOSP - ${accountName}`;
              }
              break;
            }

            case "MicrosoftCustomerAgreement": {
              // MCA: iterate profiles and invoice sections
              const profiles =
                (properties as { billingProfiles?: { value?: unknown[] } })
                  .billingProfiles?.value || [];
              for (const profile of profiles) {
                const prof = profile as {
                  displayName?: string;
                  name?: string;
                  invoiceSections?: { value?: unknown[] };
                };
                const profName = prof.displayName || prof.name;
                const sections = prof.invoiceSections?.value || [];
                for (const section of sections) {
                  const sec = section as {
                    id?: string;
                    displayName?: string;
                    name?: string;
                  };
                  if (sec.id) {
                    scopes[sec.id] =
                      `MCA - ${accountName} - Profile - ${profName} - Invoice - ${
                        sec.displayName || sec.name
                      }`;
                  }
                }
              }
              break;
            }

            case "EnterpriseAgreement": {
              // EA: iterate enrollment accounts
              const enrollments =
                (properties as { enrollmentAccounts?: unknown[] })
                  .enrollmentAccounts || [];
              for (const ea of enrollments) {
                const enrollment = ea as {
                  id?: string;
                  accountName?: string;
                };
                const enrollmentId = enrollment.id;
                if (enrollmentId) {
                  const enrollmentName = enrollment.accountName ?? "Enrollment";
                  scopes[enrollmentId] =
                    `EA - ${accountName} - Enrollment - ${enrollmentName}`;
                }
              }
              break;
            }

            case "MicrosoftPartnerAgreement": {
              // MPA: Requires customer lookups; not included here yet
              // TODO: add support for Partner Agreement (CSP) billing scopes
              break;
            }

            default: {
              // Unknown type; no-op
              break;
            }
          }
        }
      } catch (err) {
        ctx.Runtime.Logs.Package.error(
          "There was an error loading the billing scopes.",
          err,
        );
      }
    }

    return Response.json(scopes);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
