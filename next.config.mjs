/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep lunar-javascript as an external server-side package (not bundled by Webpack).
  // It's a large CommonJS module; bundling it can disrupt chunk ordering and break
  // other server-side packages (e.g. Clerk middleware detection).
  serverExternalPackages: ['lunar-javascript'],
};

export default nextConfig;
