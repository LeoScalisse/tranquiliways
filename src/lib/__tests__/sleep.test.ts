import assert from "node:assert/strict";

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function run(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run("sleep resolves after at least ms milliseconds", async () => {
  const start = Date.now();
  await sleep(80);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 75, `Expected >= 75 ms, got ${elapsed} ms`);
});

await run("sleep resolves close to ms (not wildly late)", async () => {
  const start = Date.now();
  await sleep(80);
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 300, `Expected < 300 ms, got ${elapsed} ms`);
});
