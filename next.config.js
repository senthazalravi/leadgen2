/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Mark undici as external to prevent webpack bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize undici to prevent parsing errors
      config.externals = [...(config.externals || []), 'undici']
    }
    return config
  },
}

module.exports = nextConfig
