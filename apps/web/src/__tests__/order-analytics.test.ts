import { describe, expect, it } from "vitest";
import { aggregateDailyRevenue } from "../services/order-service";

describe("order analytics aggregation", () => {
  it("groups multi-currency orders by canonical totalUsdCents across daily buckets", () => {
    const referenceDate = new Date("2026-11-15T10:00:00.000Z");
    const points = aggregateDailyRevenue(
      [
        {
          createdAt: new Date("2026-11-15T01:00:00.000Z"),
          totalUsdCents: 11_568,
        },
        {
          createdAt: new Date("2026-11-15T08:00:00.000Z"),
          totalUsdCents: 19_980,
        },
        {
          createdAt: new Date("2026-11-12T12:00:00.000Z"),
          totalUsdCents: 5_000,
        },
      ],
      14,
      referenceDate,
    );

    expect(points).toHaveLength(14);
    const today = points.find((p) => p.date === "2026-11-15");
    expect(today?.revenueUsdCents).toBe(31_548);
    expect(today?.ordersCount).toBe(2);

    const earlier = points.find((p) => p.date === "2026-11-12");
    expect(earlier?.revenueUsdCents).toBe(5_000);
  });
});
