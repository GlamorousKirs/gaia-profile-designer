import type { Config } from "@react-router/dev/config"
const isDev = process.env.NODE_ENV === 'development';

export default {
  ssr: false,
  basename: isDev ? "/" : "/gaia-profile-designer/",
} satisfies Config