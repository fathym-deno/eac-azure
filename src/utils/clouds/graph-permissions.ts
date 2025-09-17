export const REQUIRED_GRAPH_PERMISSIONS = [
  "Application.ReadWrite.All",
];

export const REQUIRED_AZURE_AD_ROLES = [
  "Application Administrator",
  "Cloud Application Administrator",
];

export class GraphPermissionError extends Error {
  public readonly requiredPermissions: string[];
  public readonly requiredDirectoryRoles: string[];
  public readonly graphError?: {
    code?: string;
    message?: string;
    statusCode?: number;
  };

  constructor(
    message: string,
    requiredPermissions: string[],
    requiredDirectoryRoles: string[],
    graphError?: { code?: string; message?: string; statusCode?: number },
  ) {
    super(message);
    this.name = "GraphPermissionError";
    this.requiredPermissions = requiredPermissions;
    this.requiredDirectoryRoles = requiredDirectoryRoles;
    this.graphError = graphError;
  }
}

export function mapGraphPermissionError(err: unknown):
  | GraphPermissionError
  | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }

  const maybeError = err as {
    statusCode?: number;
    code?: string;
    message?: string;
    error?: { code?: string; message?: string };
    body?: { error?: { code?: string; message?: string } };
  };

  const statusCode = typeof maybeError.statusCode === "number"
    ? maybeError.statusCode
    : undefined;

  const code = maybeError.code ??
    maybeError.error?.code ??
    maybeError.body?.error?.code;

  const message = maybeError.message ??
    maybeError.error?.message ??
    maybeError.body?.error?.message;

  const normalizedMessage = typeof message === "string" ? message : undefined;
  const normalizedCode = typeof code === "string"
    ? code.toLowerCase()
    : undefined;

  const insufficient = statusCode === 403 ||
    normalizedCode === "authorization_requestdenied" ||
    normalizedCode === "authentication_requestdenied" ||
    normalizedCode === "accessdenied" ||
    normalizedCode === "forbidden" ||
    (normalizedMessage &&
      normalizedMessage.toLowerCase().includes("insufficient privileges"));

  if (!insufficient) {
    return undefined;
  }

  return new GraphPermissionError(
    "Insufficient Microsoft Graph permissions to configure the Azure cloud.",
    REQUIRED_GRAPH_PERMISSIONS,
    REQUIRED_AZURE_AD_ROLES,
    {
      code,
      message: normalizedMessage,
      statusCode,
    },
  );
}
