import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { GarageEntry } from "@/components/garage-entry";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ""} />,
}));

vi.mock("@/components/kairos-app", () => ({
  KairosApp: () => <main data-testid="kairos-app">Garage app</main>,
}));

vi.mock("motion/react", async () => {
  const React = await import("react");
  const motionPropNames = new Set(["initial", "animate", "exit", "transition"]);
  const withoutMotionProps = (tag: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown> & { children?: React.ReactNode }>(function MotionElement(props, ref) {
      const { children, ...attributes } = props;
      const nativeProps = Object.fromEntries(Object.entries(attributes).filter(([name]) => !motionPropNames.has(name)));
      return React.createElement(
        tag,
        { ...nativeProps, ref } as React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>,
        children as React.ReactNode,
      );
    });

  return {
    AnimatePresence: ({ children, onExitComplete }: { children: React.ReactNode; onExitComplete?: () => void }) => {
      React.useEffect(() => {
        if (!children) onExitComplete?.();
      }, [children, onExitComplete]);
      return children;
    },
    MotionConfig: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      div: withoutMotionProps("div"),
      section: withoutMotionProps("section"),
      span: withoutMotionProps("span"),
      button: withoutMotionProps("button"),
    },
    useReducedMotion: () => false,
  };
});

function mockArtworkDecode() {
  let resolveDecode: (() => void) | undefined;
  vi.stubGlobal(
    "Image",
    class {
      src = "";

      decode() {
        return new Promise<void>((resolve) => {
          resolveDecode = resolve;
        });
      }
    },
  );
  return { finish: () => resolveDecode?.() };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("lets the user enter after a slow artwork load without claiming readiness", () => {
  vi.useFakeTimers();
  mockArtworkDecode();
  render(<GarageEntry initialContractAddress="" />);

  expect(screen.queryByTestId("kairos-app")).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(7999));
  expect(screen.queryByRole("button", { name: "Enter while artwork loads" })).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));

  const enterButton = screen.getByRole("button", { name: "Enter while artwork loads" });
  expect(screen.getByRole("status")).toHaveTextContent("POWERING ON");
  expect(screen.getByText(/Garage artwork is still loading/i)).toBeInTheDocument();
  expect(document.activeElement).toBe(enterButton);
  expect(screen.queryByTestId("kairos-app")).not.toBeInTheDocument();

  fireEvent.click(enterButton);

  expect(screen.getByTestId("kairos-app")).toBeInTheDocument();
  expect(document.querySelector(".garage-content")).toHaveAttribute("aria-hidden", "false");
});

it("keeps the normal entry button for artwork that loads promptly and clears the wait timer", async () => {
  vi.useFakeTimers();
  const setTimeoutSpy = vi.spyOn(window, "setTimeout");
  const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
  const artwork = mockArtworkDecode();
  render(<GarageEntry initialContractAddress="" />);

  artwork.finish();
  fireEvent.load(screen.getByRole("img", { name: "KAIROS emblem" }));
  await act(async () => Promise.resolve());
  act(() => vi.advanceTimersByTime(1500));

  expect(screen.getByRole("button", { name: "Enter the Garage" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Enter while artwork loads" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("GARAGE READY");
  const slowWaitTimerIndex = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === 8000);
  expect(slowWaitTimerIndex).toBeGreaterThanOrEqual(0);
  expect(clearTimeoutSpy).toHaveBeenCalledWith(setTimeoutSpy.mock.results[slowWaitTimerIndex]?.value);
});

it("clears the delayed recovery timer when the intro unmounts", () => {
  vi.useFakeTimers();
  mockArtworkDecode();
  const { unmount } = render(<GarageEntry initialContractAddress="" />);

  expect(vi.getTimerCount()).toBe(2);
  unmount();

  expect(vi.getTimerCount()).toBe(0);
});
