import { describe, expect, it } from "vitest";
import {
  $currency,
  hydrateCurrencyFromServer,
  setCurrency,
} from "../stores/currency";

describe("Nanostores currency store", () => {
  it("defaults to USD and switches cleanly between USD and IDR", () => {
    expect($currency.get()).toBe("USD");

    setCurrency("IDR");
    expect($currency.get()).toBe("IDR");

    hydrateCurrencyFromServer("USD");
    expect($currency.get()).toBe("USD");
  });
});
