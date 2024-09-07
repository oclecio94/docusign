/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["docusign-esign"],
  },
};

export default nextConfig;
