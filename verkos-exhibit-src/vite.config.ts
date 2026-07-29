/// <reference types='vitest' />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig(async ({ mode, command }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Dynamically import lovable-tagger (ESM-only package)
  const { componentTagger } = mode === 'dev' 
    ? await import('lovable-tagger')
    : { componentTagger: () => null };

  // Use mode directly as environment file suffix
  // Supported modes: dev, stag, prod, eu-prod
  const envSuffix = mode || 'dev';
  console.log('envSuffix', envSuffix, mode);

  // Keep the Vite base aligned with the router/auth websiteBasePath.
  // A mismatch here causes Lovable preview/publish to load under one path
  // and the bundles to 404 under another.
  //
  // - Lovable preview, Lovable publish (`*.lovable.app`), and local dev all
  //   serve the app at the ROOT (`/`).
  // - The Cloudflare-proxied production deploy serves it under
  //   `/verkos-reports/`. Opt into that ONLY when the build is explicitly
  //   marked for the proxy via `VITE_PROXY_BASE=/verkos-reports/`.
  const explicitBase = env.VITE_PROXY_BASE;
  const basePath =
    command === 'build' && explicitBase && explicitBase.length > 0
      ? explicitBase
      : '/';

  console.error('VITE MODE:', mode, 'COMMAND:', command, 'BASE:', basePath);

  return {
    root: __dirname,
    base: basePath,
    server: {
      // Use LOVABLE_PORT if set, fallback to 8080 for Lovable compatibility
      port: env.LOVABLE_PORT ? parseInt(env.LOVABLE_PORT) : 8080,
      // Default to Lovable hosting (IPv6 all interfaces) unless explicitly set to 'false'
      host: env.LOVABLE_ENV !== 'false' ? "::" : "localhost",
      hmr: {
        overlay: false,
      },
      fs: {
        allow: ["."],
      },
    },
    preview: {
      // Vite preview defaults to 4173 if not specified
      // If port is taken, Vite will automatically increment (4174, 4175, etc.)
      port: 4173,
      host: "localhost",
      strictPort: false, // Allow Vite to use next available port if 4173 is taken
    },
    plugins: [
      TanStackRouterVite({
        routesDirectory: path.resolve(__dirname, "./src/routes"),
        generatedRouteTree: path.resolve(__dirname, "./src/routeTree.gen.ts"),
        autoCodeSplitting: false,
      }),
      react(),
      componentTagger && componentTagger(),
      // Custom plugin to inject dynamic base href
      {
        name: 'html-transform',
        transformIndexHtml(html:string ) {
          return html.replace(
            /<base href="[^"]*" \/>/,
            `<base href="${basePath}" />`
          );
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@libs/shared": path.resolve(__dirname, "./src/libs/shared"),
        "@libs/shared/api-modules": path.resolve(__dirname, "./src/libs/shared/api-modules"),
        "@shadcn": path.resolve(__dirname, "./src/libs/shared/ui"),
        "@ui": path.resolve(__dirname, "./src/libs/shared/ui"),
        "@components": path.resolve(__dirname, "./src/libs/shared/ui"),
        "@socket": path.resolve(__dirname, "./src/libs/shared/socket"),
        "@state": path.resolve(__dirname, "./src/libs/shared/state"),
        "@types": path.resolve(__dirname, "./src/libs/shared/types"),
        // EXHIBIT: the real auth module boots SuperTokens + authenticated axios
        // and guards redirect to /login. Point at the offline stub instead.
        "@auth": path.resolve(__dirname, "./src/exhibit-auth"),
        "@hooks": path.resolve(__dirname, "./src/libs/shared/hooks"),
        "@map/public": path.resolve(__dirname, "./src/libs/shared/map/src/public"),
        "@map/private": path.resolve(__dirname, "./src/libs/shared/map/src/private"),
        "@hardware-controls": path.resolve(__dirname, "./src/libs/shared/hardware-controls/src"),
        "@hardware-controls/keyboard": path.resolve(__dirname, "./src/libs/shared/hardware-controls/src/keyboard"),
        "@env": path.resolve(__dirname, `./src/environments/environment.runtime.ts`),
      },
    },
    build: {
      sourcemap: mode === "dev",
      outDir: "dist",
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      minify: mode === "development" ? false : "terser" as const,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ["fsevents"],
      esbuildOptions: {
        target: "es2020",
      },
    },
  };
});
