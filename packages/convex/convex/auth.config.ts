export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL || "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};

