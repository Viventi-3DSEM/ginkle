import type { NextConfig } from "next";

function hostnameSupabase(): string {
  const bruto = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!bruto) return "*.supabase.co";
  try {
    return new URL(bruto).hostname || "*.supabase.co";
  } catch {
    return "*.supabase.co";
  }
}

const HEADERS_SEGURANCA = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: hostnameSupabase(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: HEADERS_SEGURANCA,
      },
    ];
  },
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
