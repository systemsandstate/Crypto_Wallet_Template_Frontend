import { Platform } from 'react-native';
import { FetchRequest } from 'ethers';

import { setupTextEncodingPolyfills } from './textEncoding';

setupTextEncodingPolyfills();

type FetchSignal = { cancelled: boolean; addListener: (fn: () => void) => void; checkSignal: () => void };

/**
 * ethers defaults to Node http/https in Metro. React Native only has fetch —
 * without this, RPC calls fail on native while web works.
 */
const nativeGetUrl = async (
  req: { url: string; method: string; headers: Record<string, string>; body?: Uint8Array; timeout: number },
  signal?: FetchSignal | null
) => {
  if (signal?.cancelled) {
    throw new Error('request cancelled before sending');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeout || 18_000);

  if (signal) {
    signal.addListener(() => controller.abort());
  }

  const headers: Record<string, string> = { ...req.headers };
  let body: string | undefined;
  if (req.body?.length) {
    body = new TextDecoder().decode(req.body);
  }

  try {
    const response = await fetch(req.url, {
      method: req.method || 'GET',
      headers,
      body,
      signal: controller.signal,
    });

    const respBody = new Uint8Array(await response.arrayBuffer());
    if (response.status < 200 || response.status >= 300) {
      const snippet = new TextDecoder().decode(respBody).slice(0, 200);
      if (response.status === 401) {
        throw new Error('Session expired');
      }
      if (response.status === 400 && /invalid json-rpc/i.test(snippet)) {
        throw new Error('Network RPC is not configured');
      }
      throw new Error(`Network RPC is not configured (${response.status}${snippet ? `: ${snippet}` : ''})`);
    }

    const respHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      respHeaders[key.toLowerCase()] = value;
    });

    return {
      statusCode: response.status,
      statusMessage: response.statusText,
      headers: respHeaders,
      body: respBody,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err || '');
    if (/aborted|abort/i.test(message)) {
      throw new Error('Network request timed out');
    }
    if (/network request failed|failed to fetch|network error/i.test(message)) {
      throw new Error('Network request failed');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

/** Ensure a FetchRequest uses React Native fetch before JsonRpcProvider sends RPC calls. */
export function attachNativeFetchRequest(
  req: FetchRequest,
  resolveAuthToken?: () => string | null | Promise<string | null>
): FetchRequest {
  if (Platform.OS !== 'web') {
    req.getUrlFunc = async (request, signal) => {
      if (resolveAuthToken) {
        const token = await resolveAuthToken();
        if (!token) {
          throw new Error('Session expired');
        }
        request.setHeader('authorization', `Bearer ${token}`);
      }
      return nativeGetUrl(request, signal);
    };
  }
  return req;
}
