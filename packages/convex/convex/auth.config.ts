export default {
  providers: [
    {
      // Clerk issuer URL - must match the "iss" claim in the JWT
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

