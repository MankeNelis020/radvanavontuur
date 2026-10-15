import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wondaro",
    short_name: "Wondaro",
    description: "Your next adventure starts with a spin.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8EB",
    theme_color: "#103D32",
    icons: [{ src: "/brand/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
