import { checkSelfHealth, getAggregatedHealth } from "./healthService.js";
const runHealthTest = async () => {
  const selfHealth = checkSelfHealth();
  if (!selfHealth || selfHealth.status !== "Healthy") {
    throw new Error("Self Health Verification Failed");
  }
  const aggregatedHealth = await getAggregatedHealth();
  if (!aggregatedHealth || !aggregatedHealth.services) {
    throw new Error("Aggregated Health Verification Failed");
  }
  console.log("Health Verification Check Passed Successfully");
  process.exit(0);
};
runHealthTest().catch((error) => {
  console.error("Health Verification Check Encountered Error:", error);
  process.exit(1);
});