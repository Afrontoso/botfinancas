/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfkit reads its AFM font files via fs.readFileSync at runtime; bundling
    // via webpack strips those data files. Externalizing keeps the require call
    // pointing at node_modules where the AFMs live.
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

export default nextConfig;
