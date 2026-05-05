import { describe, expect, it, beforeEach } from 'vitest';
import * as util from '../src/util';
import * as si from '../src/index';

describe('diagnostics scope (AsyncLocalStorage)', () => {
  beforeEach(() => {
    si.clearDiagnostics();
  });

  it('isolates diagnostics between concurrent envelope-mode calls', async () => {
    const enter = (label: string) =>
      (util as any).diagnosticContext.run({ records: [] as any[] }, async () => {
        const scope = (util as any).diagnosticContext.getStore();
        (util as any).pushDiagnostic({
          functionName: label,
          module: label,
          code: 'test_marker',
          issue: 'parse_error',
          message: `marker for ${label}`
        });
        await new Promise((resolve) => setTimeout(resolve, 5 + Math.random() * 10));
        return scope.records as any[];
      });

    const [a, b, c] = await Promise.all([enter('alpha'), enter('beta'), enter('gamma')]);

    expect(a.map((r: any) => r.functionName)).toEqual(['alpha']);
    expect(b.map((r: any) => r.functionName)).toEqual(['beta']);
    expect(c.map((r: any) => r.functionName)).toEqual(['gamma']);

    const global = si.diagnostics().map((r) => r.functionName).sort();
    expect(global).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('records nothing in scope when called outside a context', () => {
    (util as any).pushDiagnostic({
      functionName: 'naked',
      module: 'naked',
      code: 'test_marker',
      issue: 'parse_error',
      message: 'naked'
    });
    const ctx = (util as any).diagnosticContext.getStore();
    expect(ctx).toBeUndefined();
    expect(si.diagnostics().some((r) => r.functionName === 'naked')).toBe(true);
  });
});
