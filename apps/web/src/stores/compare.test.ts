import { beforeEach, describe, expect, it } from "vitest";
import { useCompare } from "./compare";

beforeEach(() => useCompare.getState().clear());

describe("compare store", () => {
  it("toggles ids and keeps at most three", () => {
    const { toggle } = useCompare.getState();
    ["a", "b", "c", "d"].forEach(toggle);
    expect(useCompare.getState().ids).toEqual(["b", "c", "d"]);
    toggle("c");
    expect(useCompare.getState().ids).toEqual(["b", "d"]);
  });
});
