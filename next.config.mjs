/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfkit lê os arquivos .afm de fonte via fs.readFileSync em runtime; quando
    // o webpack bundla, esses arquivos somem e quebra com ENOENT. Externalizar
    // mantém o require apontando pro node_modules onde os .afm de fato existem.
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

export default nextConfig;
