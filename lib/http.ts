export function json(data: unknown, init?: number | ResponseInit): Response {
  const opts = typeof init === "number" ? { status: init } : init;
  return Response.json(data, opts);
}

export function bad(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return Response.json({ ok: false, message, ...extra }, { status });
}
