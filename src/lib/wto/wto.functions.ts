// Server functions exposed to the client. Static imports of these
// are safe — the build replaces them with RPC stubs in client bundles.

import { createServerFn } from "@tanstack/react-start";
import {
  fetchEpingAlerts,
  fetchFacilityScores,
  fetchInternationalEvents,
  fetchMarketTrends,
  fetchQuantitativeRestrictions,
} from "./wto.server";

export const getEpingAlerts = createServerFn({ method: "GET" })
  .inputValidator((data: { product?: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    const alerts = await fetchEpingAlerts(data);
    return { alerts };
  });

export const getQuantitativeRestrictions = createServerFn({ method: "GET" })
  .inputValidator((data: { product?: string }) => data)
  .handler(async ({ data }) => {
    const restrictions = await fetchQuantitativeRestrictions(data);
    return { restrictions };
  });

export const getMarketTrends = createServerFn({ method: "GET" })
  .inputValidator((data: { product?: string }) => data)
  .handler(async ({ data }) => {
    const trends = await fetchMarketTrends(data);
    return { trends };
  });

export const getFacilityScores = createServerFn({ method: "GET" }).handler(
  async () => {
    const scores = await fetchFacilityScores();
    return { scores };
  },
);

export const getInternationalEvents = createServerFn({ method: "GET" }).handler(
  async () => {
    const events = await fetchInternationalEvents();
    return { events };
  },
);
