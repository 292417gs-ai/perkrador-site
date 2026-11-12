// GET /api/health — 只对订阅地址做 HEAD/GET 健康检查并返回 JSON 状态，不代理流量。
const SUB_URL = "https://warm-voyager-3745.de.deplexo.com/clash.yaml";

export default async function handler(req, res) {
  const started = Date.now();
  try {
    let r = await fetch(SUB_URL, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    // 有些静态服务不支持 HEAD 时回退到 GET（只读响应头，不使用响应体作代理）
    if (r.status === 405 || r.status === 501) {
      r = await fetch(SUB_URL, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000) });
      await r.arrayBuffer().catch(() => null);
    }
    const ms = Date.now() - started;
    const ok = r.status === 200;
    res.status(ok ? 200 : 502).json({
      ok,
      status: r.status,
      latencyMs: ms,
      checkedAt: new Date().toISOString(),
    });
  } catch (e) {
    res.status(502).json({
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      error: String(e && e.message ? e.message : e),
    });
  }
}
