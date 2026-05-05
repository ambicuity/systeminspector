import type { RedactionOptions } from './types';

const REDACTED = '[redacted]';
const MAC_RE = /\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/gi;
const IP4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

function normalize(redact?: RedactionOptions | boolean): Required<RedactionOptions> {
  if (redact === true) {
    return {
      serialNumbers: true,
      macAddresses: true,
      usernames: true,
      ipAddresses: true,
      uuids: true,
      processArgs: true
    };
  }
  if (!redact) {
    return {
      serialNumbers: false,
      macAddresses: false,
      usernames: false,
      ipAddresses: false,
      uuids: false,
      processArgs: false
    };
  }
  return {
    serialNumbers: Boolean(redact?.serialNumbers),
    macAddresses: Boolean(redact?.macAddresses),
    usernames: Boolean(redact?.usernames),
    ipAddresses: Boolean(redact?.ipAddresses),
    uuids: Boolean(redact?.uuids),
    processArgs: Boolean(redact?.processArgs)
  };
}

function shouldRedactKey(key: string, options: Required<RedactionOptions>): boolean {
  const normalized = key.toLowerCase();
  if (options.serialNumbers && (normalized.includes('serial') || normalized === 'assettag')) {
    return true;
  }
  if (options.macAddresses && (normalized === 'mac' || normalized.includes('macaddr') || normalized.includes('macdevice') || normalized.includes('machost'))) {
    return true;
  }
  if (options.usernames && (normalized === 'user' || normalized === 'username' || normalized === 'ruser')) {
    return true;
  }
  if (options.ipAddresses && (normalized === 'ip' || normalized === 'ip4' || normalized === 'ip6' || normalized.endsWith('address'))) {
    return true;
  }
  if (options.uuids && (normalized === 'uuid' || normalized.includes('uuid') || normalized === 'hardware')) {
    return true;
  }
  if (options.processArgs && (normalized === 'command' || normalized === 'params' || normalized === 'path')) {
    return true;
  }
  return false;
}

function redactString(value: string, options: Required<RedactionOptions>): string {
  let result = value;
  if (options.macAddresses) {
    result = result.replace(MAC_RE, REDACTED);
  }
  if (options.ipAddresses) {
    result = result.replace(IP4_RE, REDACTED);
  }
  if (options.uuids) {
    result = result.replace(UUID_RE, REDACTED);
  }
  return result;
}

export function redactData<T>(data: T, redact?: RedactionOptions | boolean): T {
  const options = normalize(redact);
  if (!Object.values(options).some(Boolean)) {
    return data;
  }

  function visit(value: unknown, key = ''): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    if (shouldRedactKey(key, options)) {
      return REDACTED;
    }
    if (typeof value === 'string') {
      return redactString(value, options);
    }
    if (Array.isArray(value)) {
      return value.map((item) => visit(item, key));
    }
    if (typeof value === 'object') {
      const output: Record<string, unknown> = {};
      for (const [childKey, childValue] of Object.entries(value)) {
        output[childKey] = visit(childValue, childKey);
      }
      return output;
    }
    return value;
  }

  return visit(data) as T;
}
