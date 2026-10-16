/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optional local build mode for machines with limited free disk space.
  webpack(config) {
    if (process.env.ZYNTH_LOW_DISK_BUILD === "1") config.cache = false;
    return config;
  },
};

export default nextConfig;
