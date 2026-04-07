import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Allow tuned qualities for hero (LCP) vs blurred overlay copies
    qualities: [55, 75, 80, 85, 100],
  },
};

export default withNextIntl(nextConfig);
