export function devicePositionAvailable(): boolean {
  return window.isSecureContext && "geolocation" in navigator;
}

export function readDevicePosition(): Promise<GeolocationPosition> {
  if (!devicePositionAvailable()) {
    return Promise.reject(new Error("unavailable"));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
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
