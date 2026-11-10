import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const MAX_STDOUT = 20000;

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function performanceFrom(exitCode, metrics) {
  const passed = num(metrics.test_passed) || 0;
  const failed = num(metrics.test_failed) || 0;
  const total = passed + failed;
  const endpointsTotal = num(metrics.endpoints_total);
  const endpointsOk = num(metrics.endpoints_ok);

  const verdict =
    exitCode === 0 && failed === 0
      ? 'pass'
      : failed > 0 || (endpointsTotal !== null && endpointsOk !== null && endpointsOk < endpointsTotal)
        ? 'degraded'
        : 'fail';

  return {
    verdict,
    exit_code: exitCode,
    build_seconds: num(metrics.build_seconds),
    p95_latency_ms: num(metrics.p95_latency_ms),
    tests: { passed, failed, pass_rate: total ? Math.round((passed / total) * 100) : null },
    endpoints: {
      ok: endpointsOk,
      total: endpointsTotal,
      health: endpointsTotal && endpointsOk !== null ? Math.round((endpointsOk / endpointsTotal) * 100) : null
    },
    captured_at: new Date().toISOString()
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const spec_id = typeof body.spec_id === 'string' ? body.spec_id : '';
    if (!spec_id) return Response.json({ error: 'spec_id is required.' }, { status: 400 });

    const spec = await base44.entities.RebuildSpec.get(spec_id);
    if (!spec) return Response.json({ error: 'Spec not found.' }, { status: 404 });

    const metrics = body.metrics && typeof body.metrics === 'object' ? body.metrics : {};
    const exitCode = num(body.exit_code);
    const rawStdout = typeof body.stdout === 'string' ? body.stdout : '';
    const stdout = rawStdout.length > MAX_STDOUT ? rawStdout.slice(0, MAX_STDOUT) + '\n… truncated' : rawStdout;

    if (!stdout.trim() && exitCode === null) {
      return Response.json({ error: 'Post a transcript or an exit code so there is something to capture.' }, { status: 400 });
    }

    const performance = performanceFrom(exitCode === null ? 1 : exitCode, metrics);

    const saved = await base44.entities.RebuildSpec.update(spec_id, {
      status: performance.verdict === 'fail' ? 'failed' : 'captured',
      run_output: {
        exit_code: exitCode,
        stdout,
        stdout_bytes: rawStdout.length,
        truncated: rawStdout.length > MAX_STDOUT,
        metrics,
        captured_at: performance.captured_at,
        captured_by: user.email || user.id
      },
      performance
    });

    return Response.json({ spec: saved });
  } catch (error) {
    console.log('captureRunOutput failed: ' + (error && error.message));
    return Response.json(
      { error: 'The run output could not be captured: ' + (error && error.message ? error.message : 'unknown error') },
      { status: 500 }
    );
  }
}