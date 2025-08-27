/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
};
