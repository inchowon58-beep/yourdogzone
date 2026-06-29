import https from "node:https";
import { lookup as dnsLookup } from "node:dns";
import { Agent, fetch as undiciFetch, type RequestInfo } from "undici";

export function createIpv4Tls12Agent(): https.Agent {
  return new https.Agent({
    keepAlive: true,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
    lookup: (hostname, options, callback) => {
      dnsLookup(hostname, { ...options, family: 4 }, callback);
    },
  });
}

export const ipv4Dispatcher = new Agent({
  connect: {
    family: 4,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
  },
});

export async function ipv4Fetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const response = await undiciFetch(input as RequestInfo, {
    ...init,
    dispatcher: ipv4Dispatcher,
  } as Parameters<typeof undiciFetch>[1]);

  return response as unknown as Response;
}
