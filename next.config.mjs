/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', 
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 允許載入外部圖片 (如頭像)
      },
    ],
  },
};

export default nextConfig;