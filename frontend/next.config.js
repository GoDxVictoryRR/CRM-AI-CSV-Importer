/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Next.js dev server to accept requests from the local network IP
  // (needed when running on Wi-Fi where the browser resolves via 192.168.x.x)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.0.0/16', // local network subnet
  ],
};

module.exports = nextConfig;
