/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 這能讓 Docker 部署更穩定
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig