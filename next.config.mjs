/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {source:"/sw.js",headers:[{key:"Cache-Control",value:"no-cache, no-store, must-revalidate"},{key:"Service-Worker-Allowed",value:"/"}]},
      {source:"/downloads/:file*.apk",headers:[{key:"Content-Type",value:"application/vnd.android.package-archive"},{key:"Content-Disposition",value:"attachment"}]},
    ];
  },
  // Optional local build mode for machines with limited free disk space.
  webpack(config) {
    if (process.env.ZYNTH_LOW_DISK_BUILD === "1") config.cache = false;
    return config;
  },
};

export default nextConfig;
