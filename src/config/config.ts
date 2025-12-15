export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'ABHI_BLOG_WEBSITE_SECRET',
  },
}); 