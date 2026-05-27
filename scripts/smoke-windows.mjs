const baseUrl = (process.env.SMOKE_BASE_URL || process.env.PORTAL_BASE_URL || "http://localhost:5001").replace(/\/$/, "");
const expectProduction = process.env.SMOKE_EXPECT_PRODUCTION === "true" || process.env.NODE_ENV === "production";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
    return {
      path,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type") || ""
    };
  } catch (error) {
    return {
      path,
      status: 0,
      ok: false,
      contentType: "",
      error: error instanceof Error ? error.message : "Request failed"
    };
  }
}

function printResult(label, result, expected) {
  const ok = expected(result);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${result.status || "no response"} ${result.path}${result.error ? ` (${result.error})` : ""}`);
  return ok;
}

const checks = [];
console.log(`COSTAATT Windows smoke test`);
console.log(`Base URL: ${baseUrl}`);
console.log(`Production expectation: ${expectProduction ? "enabled" : "disabled"}`);

const health = await request("/api/health");
checks.push(printResult("health endpoint", health, (result) => result.status === 200 || result.status === 503));
if (health.contentType.includes("application/json")) {
  const data = await fetch(`${baseUrl}/api/health`).then((response) => response.json()).catch(() => null);
  console.log(`Health status: ${data?.status || "unknown"}`);
  console.log(`Build: ${data?.build?.appVersion || "unknown"} (${data?.build?.gitCommit || "not-set"})`);
}

checks.push(printResult("forms page", await request("/forms"), (result) => result.status === 200 || result.status === 302));
checks.push(printResult("admin route responds", await request("/admin"), (result) => [200, 302, 307, 308].includes(result.status)));

const devSession = await request("/api/dev/session");
if (expectProduction) {
  checks.push(printResult("dev session blocked", devSession, (result) => result.status === 404));
} else {
  console.log(`INFO dev session status in non-production: ${devSession.status}`);
}

console.log("\nManual checks still required:");
console.log("- Log in through QuickLaunch and verify /admin/diagnostics signed-in identity claims.");
console.log("- Send a diagnostics email to student, reviewer, and Registry recipients.");
console.log("- Submit one test request, reviewer-approve it, Registry-finalize it, and verify audit history.");
console.log("- Preview/download one attachment and confirm uploads are included in the VM backup job.");

if (checks.every(Boolean)) {
  console.log("\nSmoke test passed.");
} else {
  console.error("\nSmoke test failed.");
  process.exit(1);
}
