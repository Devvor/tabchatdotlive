import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Retry failed links every 6 hours
crons.interval(
  "retry failed links",
  { hours: 6 },
  internal.actions.scrapeLink.retryFailedLinks
);

export default crons;

