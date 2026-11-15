import { performance } from "node:perf_hooks";

const baseUrl = new URL(process.argv[2] || "http://localhost:3000");
const requestCount = Number(process.argv[3] || 20);
const concurrency = Number(process.argv[4] || 2);
const endpointPath = process.env.PERF_PATH || "/";

if (!["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname) || baseUrl.username || baseUrl.password) {
  throw new Error("The smoke harness is limited to localhost to avoid generating external load.");
}
if (!Number.isInteger(requestCount) || requestCount < 1 || requestCount > 50) {
  throw new Error("Request count must be an integer from 1 to 50.");
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 5) {
  throw new Error("Concurrency must be an integer from 1 to 5.");
}
if (!endpointPath.startsWith("/") || endpointPath.startsWith("//")) {
  throw new Error("PERF_PATH must be a same-origin path beginning with one slash.");
}

const target = new URL(endpointPath, baseUrl);
const cookie = process.env.PERF_COOKIE;
const durations = [];
const statuses = new Map();
let nextIndex = 0;
const startedAt = performance.now();
const runTimeout = AbortSignal.timeout(30_000);

async function worker() {
  while (nextIndex < requestCount) {
    nextIndex += 1;
    const requestStartedAt = performance.now();
    const response = await fetch(target, {
      headers: cookie ? { cookie } : undefined,
      signal: runTimeout,
    });
    durations.push(performance.now() - requestStartedAt);
    statuses.set(response.status, (statuses.get(response.status) || 0) + 1);
    await response.body?.cancel();
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, requestCount) }, worker));
durations.sort((a, b) => a - b);
const percentile = (ratio) => durations[Math.min(durations.length - 1, Math.ceil(durations.length * ratio) - 1)];
const elapsedSeconds = (performance.now() - startedAt) / 1000;

console.log(`GET ${target.pathname}${target.search}`);
console.log(`Requests: ${requestCount}; concurrency: ${Math.min(concurrency, requestCount)}; elapsed: ${elapsedSeconds.toFixed(2)} s`);
console.log(`Latency ms: median ${percentile(0.5).toFixed(1)}, p95 ${percentile(0.95).toFixed(1)}`);
console.log(`Throughput: ${(requestCount / elapsedSeconds).toFixed(2)} requests/s`);
console.log(`HTTP statuses: ${[...statuses].sort(([a], [b]) => a - b).map(([status, count]) => `${status}=${count}`).join(", ")}`);
