import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Button } from "./button";

it("fires onClick and respects disabled", async () => {
  const onClick = vi.fn();
  const { rerender } = render(<Button onClick={onClick}>Go</Button>);
  await userEvent.click(screen.getByRole("button", { name: "Go" }));
  expect(onClick).toHaveBeenCalledTimes(1);
  rerender(<Button disabled onClick={onClick}>Go</Button>);
  expect(screen.getByRole("button")).toBeDisabled();
});
