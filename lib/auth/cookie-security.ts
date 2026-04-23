export function shouldUseSecureCookies(request?: Request): boolean {
  const forwardedProto = request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  if (request) {
    try {
      return new URL(request.url).protocol === "https:";
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV === "production";
}