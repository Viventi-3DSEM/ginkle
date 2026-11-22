import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Pedido pelo próprio comando de upgrade de segurança: marca o app como já
  // atendido (`security`) para ele parar de recomendar o upgrade. O Next já usa
  // `security` como padrão interno; aqui só fica explícito.
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
