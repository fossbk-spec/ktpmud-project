import vinext from "vinext";
import { defineConfig } from "vite";

const PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";

export default defineConfig(async () => {
  const uiOnly = process.env.HAHA_UI_ONLY === "1";
  const cloudflarePlugin = uiOnly
    ? []
    : [
        (await import("@cloudflare/vite-plugin")).cloudflare({
          viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
          inspectorPort: false,
          config: {
            name: "ha-ha-farm",
            main: "./worker/index.ts",
            compatibility_flags: ["nodejs_compat"],
            d1_databases: [
              {
                binding: "DB",
                database_name: "ha-ha-farm-db",
                database_id: PLACEHOLDER_DATABASE_ID,
              },
            ],
          },
        }),
      ];

  return {
    plugins: [vinext(), ...cloudflarePlugin],
  };
});
