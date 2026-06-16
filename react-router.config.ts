import type { Config } from "@react-router/dev/config"

export default {
  // MUST be false for static hosting on GitHub Pages
  ssr: false,
  
  // Sets the internal router prefix to your repo name
  basename: "/gaia-profile-designer/",
} satisfies Config