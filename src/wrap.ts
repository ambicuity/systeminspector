'use strict';

import * as util from './util';
import { redactData } from './redaction';
import { schemaVersion } from './schema';
import type {
  Callback,
  DiagnosticRecord,
  InspectEnvelope,
  InspectEnvelopeOptions,
  InspectOptions,
  PublicFunctionName
} from './types';

export type OptionsCallback<T> = Callback<T> | InspectOptions | InspectEnvelopeOptions | undefined;

export function normalizeOptions<T>(
  options?: OptionsCallback<T>,
  callback?: Callback<T>
): { options: InspectOptions | InspectEnvelopeOptions; callback?: Callback<T> } {
  if (util.isFunction(options)) {
    return { options: {}, callback: options as Callback<T> };
  }
  return { options: (options || {}) as InspectOptions | InspectEnvelopeOptions, callback };
}

export async function withInspectOptions<T>(
  functionName: PublicFunctionName,
  task: () => Promise<T>,
  options?: InspectOptions | InspectEnvelopeOptions,
  callback?: Callback<T | InspectEnvelope<T>>
): Promise<T | InspectEnvelope<T>> {
  options = util.applyInspectPolicy((options || {}) as InspectOptions) as InspectOptions | InspectEnvelopeOptions;
  const started = Date.now();
  const scope = { records: [] as DiagnosticRecord[] };
  let data = await util.diagnosticContext.run(scope, () => util.withTimeout(functionName, task(), options?.timeoutMs || 0, options?.signal));
  data = redactData(data, options?.redact);
  if ((options as InspectEnvelopeOptions | undefined)?.envelope) {
    const envelope: InspectEnvelope<T> = {
      schemaVersion: schemaVersion(),
      data,
      diagnostics: scope.records,
      durationMs: Date.now() - started,
      source: functionName,
      platform: process.platform,
      confidence: 'high'
    };
    callback?.(envelope);
    return envelope;
  }
  callback?.(data);
  return data;
}

export function wrapInspectFunction<T>(functionName: PublicFunctionName, task: () => Promise<any>, options?: any, callback?: any): Promise<T | InspectEnvelope<T>> {
  const normalized = normalizeOptions<T>(options, callback);
  return withInspectOptions(functionName, task, normalized.options, normalized.callback as Callback<T | InspectEnvelope<T>> | undefined) as Promise<
    T | InspectEnvelope<T>
  >;
}
