export async function initializeMocks() {
  if (typeof window === "undefined") {
    return;
  }

  const { worker } = await import("./worker");

  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}

