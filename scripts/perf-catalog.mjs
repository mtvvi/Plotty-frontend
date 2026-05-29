#!/usr/bin/env node
/* global console, document, performance, PerformanceObserver, process, window */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const defaultTargetUrl = "https://plotty-stories.duckdns.org/";
const cpuThrottleRate = 4;

function parseArgs(argv) {
  const args = {
    output: path.join("/tmp", `plotty-catalog-perf-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
    reference: "",
    url: defaultTargetUrl,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--url" && next) {
      args.url = next;
      index += 1;
    } else if (arg === "--reference" && next) {
      args.reference = next;
      index += 1;
    } else if (arg === "--output" && next) {
      args.output = next;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: npm run perf:catalog -- --url http://localhost:3000 --reference https://generationx5.tech/

Options:
  --url <url>         Plotty catalog URL to measure. Defaults to ${defaultTargetUrl}
  --reference <url>   Optional reference URL to measure with the same harness.
  --output <path>     JSON report path. Defaults to /tmp/plotty-catalog-perf-<timestamp>.json`);
}

function percentile(values, percentileValue) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);

  return sorted[index];
}

async function installPerformanceCollectors(page) {
  await page.addInitScript(() => {
    window.__plottyPerf = {
      cls: 0,
      lcp: null,
      longTasks: [],
      paints: [],
    };

    const state = window.__plottyPerf;

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.longTasks.push({
            duration: entry.duration,
            name: entry.name,
            startTime: entry.startTime,
          });
        }
      }).observe({ entryTypes: ["longtask"] });
    } catch {
      // Some engines disable this observer type in automation.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            state.cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Some engines disable this observer type in automation.
    }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        state.lcp = entries.length ? entries[entries.length - 1].startTime : state.lcp;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Some engines disable this observer type in automation.
    }

    try {
      new PerformanceObserver((list) => {
        state.paints = list.getEntries().map((entry) => ({
          name: entry.name,
          startTime: entry.startTime,
        }));
      }).observe({ type: "paint", buffered: true });
    } catch {
      // Some engines disable this observer type in automation.
    }
  });
}

async function measureScrollFrames(page) {
  return page.evaluate(async () => {
    const root = document.scrollingElement ?? document.documentElement;
    const maxScrollY = Math.max(0, root.scrollHeight - window.innerHeight);
    const samples = [];

    if (maxScrollY <= 0) {
      return {
        frames: 0,
        maxFrameMs: 0,
        p95FrameMs: 0,
        framesOver50Ms: 0,
      };
    }

    let previous = performance.now();
    const frameCount = 150;

    for (let frame = 0; frame < frameCount; frame += 1) {
      await new Promise((resolve) => {
        window.requestAnimationFrame((now) => {
          samples.push(now - previous);
          previous = now;

          const progress = frame / Math.max(1, frameCount - 1);
          const direction = progress <= 0.5 ? progress * 2 : (1 - progress) * 2;
          window.scrollTo(0, maxScrollY * direction);
          resolve();
        });
      });
    }

    window.scrollTo(0, 0);

    const sorted = [...samples].sort((left, right) => left - right);
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);

    return {
      frames: samples.length,
      maxFrameMs: Math.max(...samples),
      p95FrameMs: sorted[p95Index] ?? 0,
      framesOver50Ms: samples.filter((sample) => sample > 50).length,
    };
  });
}

async function waitForAppReady(page) {
  await page
    .waitForFunction(() => !document.querySelector(".plotty-page-shell.animate-pulse"), undefined, { timeout: 15_000 })
    .catch(() => undefined);
}

async function measureTarget(browser, target) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await installPerformanceCollectors(page);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottleRate });

  try {
    const response = await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
    await waitForAppReady(page);
    await page.waitForTimeout(750);

    const domMetrics = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("*"));
      const animatedElements = elements.filter((element) => {
        const style = window.getComputedStyle(element);
        const hasAnimation = style.animationName !== "none" && style.animationDuration !== "0s";
        const transitionDurations = style.transitionDuration.split(",").map((value) => Number.parseFloat(value) || 0);
        const hasTransition = transitionDurations.some((duration) => duration > 0);

        return hasAnimation || hasTransition;
      });
      const willChangeElements = elements.filter((element) => window.getComputedStyle(element).willChange !== "auto");
      const shadowElements = elements.filter((element) => window.getComputedStyle(element).boxShadow !== "none");

      return {
        animatedElements: animatedElements.length,
        bodyHeight: document.body.scrollHeight,
        domNodes: document.querySelectorAll("*").length,
        images: document.images.length,
        shadowElements: shadowElements.length,
        title: document.title,
        willChangeElements: willChangeElements.length,
      };
    });

    const scroll = await measureScrollFrames(page);
    await page.waitForTimeout(500);

    const runtimeMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource").map((entry) => ({
        decodedBodySize: entry.decodedBodySize,
        duration: entry.duration,
        initiatorType: entry.initiatorType,
        name: entry.name,
        transferSize: entry.transferSize,
      }));
      const scripts = resources.filter((resource) => resource.initiatorType === "script");
      const stylesheets = resources.filter((resource) => resource.initiatorType === "css" || resource.name.includes(".css"));
      const images = resources.filter((resource) => resource.initiatorType === "img" || /\.(avif|gif|jpe?g|png|svg|webp)([?#]|$)/i.test(resource.name));

      return {
        cls: window.__plottyPerf?.cls ?? 0,
        decodedJsBytes: scripts.reduce((total, resource) => total + (resource.decodedBodySize || 0), 0),
        imageTransferBytes: images.reduce((total, resource) => total + (resource.transferSize || 0), 0),
        lcpMs: window.__plottyPerf?.lcp ?? null,
        longTasks: window.__plottyPerf?.longTasks ?? [],
        paints: window.__plottyPerf?.paints ?? [],
        resources: {
          images: images.length,
          scripts: scripts.length,
          stylesheets: stylesheets.length,
          total: resources.length,
        },
        transferJsBytes: scripts.reduce((total, resource) => total + (resource.transferSize || 0), 0),
      };
    });
    const longTaskDurations = runtimeMetrics.longTasks.map((task) => task.duration);

    return {
      ...target,
      cpuThrottleRate,
      ok: response?.ok() ?? false,
      status: response?.status() ?? null,
      consoleErrors,
      pageErrors,
      metrics: {
        ...domMetrics,
        ...runtimeMetrics,
        longTaskCount: longTaskDurations.length,
        maxLongTaskMs: Math.max(0, ...longTaskDurations),
        p95LongTaskMs: percentile(longTaskDurations, 95),
        scroll,
      },
    };
  } catch (error) {
    return {
      ...target,
      cpuThrottleRate,
      error: error instanceof Error ? error.message : String(error),
      ok: false,
      consoleErrors,
      pageErrors,
    };
  } finally {
    await context.close();
  }
}

function printSummary(report) {
  for (const result of report.results) {
    if (!result.metrics) {
      console.log(`${result.name}: failed: ${result.error ?? "unknown error"}`);
      continue;
    }

    const metrics = result.metrics;

    console.log(
      [
        `${result.name}: ${result.url}`,
        `status=${result.status}`,
        `dom=${metrics.domNodes}`,
        `willChange=${metrics.willChangeElements}`,
        `animated=${metrics.animatedElements}`,
        `shadows=${metrics.shadowElements}`,
        `decodedJsKB=${Math.round(metrics.decodedJsBytes / 1024)}`,
        `maxLongTaskMs=${Math.round(metrics.maxLongTaskMs)}`,
        `scrollP95Ms=${Math.round(metrics.scroll.p95FrameMs)}`,
        `scrollFramesOver50=${metrics.scroll.framesOver50Ms}`,
        `consoleErrors=${result.consoleErrors.length}`,
      ].join(" | "),
    );
  }

  console.log(`Report: ${report.output}`);
}

const args = parseArgs(process.argv.slice(2));
const targets = [{ name: "plotty", url: args.url }];

if (args.reference) {
  targets.push({ name: "reference", url: args.reference });
}

const browser = await chromium.launch({ headless: true });
const startedAt = new Date().toISOString();
const results = [];

try {
  for (const target of targets) {
    results.push(await measureTarget(browser, target));
  }
} finally {
  await browser.close();
}

const report = {
  cpuThrottleRate,
  output: args.output,
  results,
  startedAt,
};

mkdirSync(path.dirname(args.output), { recursive: true });
writeFileSync(args.output, `${JSON.stringify(report, null, 2)}\n`);
printSummary(report);

if (!results[0]?.ok) {
  process.exitCode = 1;
}
