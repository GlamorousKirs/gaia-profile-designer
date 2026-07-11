import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("gallery", "routes/gallery.tsx"),
    route('studio', 'routes/studio.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('logo-recolor', 'routes/logo-recolor.tsx'),
    route('avatar-animation', 'routes/avatar-animation.tsx')
] satisfies RouteConfig;