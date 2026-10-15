import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wondaro",
    short_name: "Wondaro",
    description: "Je volgende avontuur begint met een draai.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8EB",
    theme_color: "#103D32",
    lang: "nl",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
