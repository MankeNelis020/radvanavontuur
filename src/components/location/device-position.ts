function requestPosition(timeout: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout,
      maximumAge: 0,
    });
  });
}

async function queryGeoPermission(): Promise<PermissionStatus | null> {
  if (!navigator.permissions?.query) return null;
  try {
    return await navigator.permissions.query({ name: "geolocation" });
  } catch {
    return null;
  }
}

function waitForPermission(permission: PermissionStatus, timeoutMs: number): Promise<PermissionState> {
  if (permission.state !== "prompt") return Promise.resolve(permission.state);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      permission.onchange = null;
      resolve(permission.state);
    }, timeoutMs);
    permission.onchange = () => {
      window.clearTimeout(timer);
      permission.onchange = null;
      resolve(permission.state);
    };
  });
}

export function devicePositionAvailable(): boolean {
  return window.isSecureContext && "geolocation" in navigator;
}

export async function readDevicePosition(): Promise<GeolocationPosition> {
  if (!devicePositionAvailable()) {
    return Promise.reject(new Error("unavailable"));
  }
  const permission = await queryGeoPermission();
  if (permission?.state === "prompt") {
    const pending = requestPosition(20_000);
    const decision = await waitForPermission(permission, 60_000);
    if (decision === "denied") {
      pending.catch(() => undefined);
      return Promise.reject({ code: 1 });
    }
    if (decision === "granted") {
      try {
        return await pending;
      } catch {
        return requestPosition(20_000);
      }
    }
  }
  return requestPosition(20_000);
}

export function geolocationErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    const code = Number((error as { code: number }).code);
    if (code === 1) {
      return "Je browser deelt je locatie niet. Sta het toe in de site-instellingen, of vul een plaats in.";
    }
    if (code === 3) {
      return "Je locatie kwam niet op tijd binnen. Probeer het nog eens, of vul een plaats in.";
    }
  }
  return "Je locatie is nu niet beschikbaar. Vul een plaats in.";
}
