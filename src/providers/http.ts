export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 4000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRetry(
  url: string,
  init: RequestInit = {},
  timeoutMs = 4000,
): Promise<Response> {
  try {
    const response = await fetchWithTimeout(url, init, timeoutMs);
    if (response.status >= 500 || response.status === 429) {
      return fetchWithTimeout(url, init, timeoutMs);
    }
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return fetchWithTimeout(url, init, timeoutMs);
    }
    throw error;
  }
}
