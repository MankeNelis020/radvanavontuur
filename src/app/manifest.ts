import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rad van Avontuur",
    short_name: "Avontuur",
    description: "Jij bepaalt de grenzen. Het rad bepaalt het avontuur.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#17352a",
    lang: "nl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
