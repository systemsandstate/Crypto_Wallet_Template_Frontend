/** React Native / Hermes may lack TextEncoder/TextDecoder — ethers and RPC fetch need them. */
export function setupTextEncodingPolyfills(): void {
  if (typeof globalThis.TextDecoder === 'undefined') {
    globalThis.TextDecoder = class TextDecoder {
      decode(input?: ArrayBuffer | ArrayBufferView): string {
        const bytes =
          input instanceof Uint8Array
            ? input
            : input
              ? new Uint8Array(input instanceof ArrayBuffer ? input : (input as ArrayBufferView).buffer)
              : new Uint8Array();
        let result = '';
        for (let i = 0; i < bytes.length; i += 1) {
          result += String.fromCharCode(bytes[i]!);
        }
        return result;
      }
    } as typeof TextDecoder;
  }

  if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = class TextEncoder {
      encode(input = ''): Uint8Array {
        const out = new Uint8Array(input.length);
        for (let i = 0; i < input.length; i += 1) {
          out[i] = input.charCodeAt(i)!;
        }
        return out;
      }
    } as typeof TextEncoder;
  }
}
