/** @jest-environment jsdom */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { getAgentesDashboard } from "./services/agentesService";
import useAgentesDashboard from "./useAgentesDashboard";

jest.mock("./services/agentesService", () => ({
  getAgentesDashboard: jest.fn(),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let root;
let container;
let state;
let onError;
function Harness(props) {
  state = useAgentesDashboard({ ...props, onError });
  return null;
}
function render(month, extra = {}) {
  act(() =>
    root.render(
      createElement(Harness, { id: "7", month, enabled: true, ...extra })
    )
  );
}
async function settle(request, value, failure = false) {
  await act(async () => {
    if (failure) request.reject(value);
    else request.resolve(value);
    await request.promise.catch(() => {});
  });
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  getAgentesDashboard.mockReset();
  onError = jest.fn();
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

it("keeps September data when August completes after switching months", async () => {
  const august = deferred();
  const september = deferred();
  getAgentesDashboard
    .mockReturnValueOnce(august.promise)
    .mockReturnValueOnce(september.promise);
  render("2026-08");
  render("2026-09");
  expect(state.loading).toBe(true);
  await settle(september, { month: "2026-09", monthlyPayments: [] });
  await settle(august, {
    month: "2026-08",
    monthlyPayments: [{ totalPaymentValue: 271.6 }],
  });
  expect(state.dashboard).toEqual({ month: "2026-09", monthlyPayments: [] });
  expect(state.loading).toBe(false);
  expect(getAgentesDashboard).toHaveBeenLastCalledWith("7", "2026-09");
});

it("clears previous orders while loading and after failure, and supports retry", async () => {
  const august = deferred();
  const september = deferred();
  const retry = deferred();
  getAgentesDashboard
    .mockReturnValueOnce(august.promise)
    .mockReturnValueOnce(september.promise)
    .mockReturnValueOnce(retry.promise);
  render("2026-08");
  await settle(august, {
    month: "2026-08",
    monthlyPayments: [{ totalPaymentValue: 271.6 }],
  });
  render("2026-09");
  expect(state.dashboard).toBeNull();
  expect(state.loading).toBe(true);
  await settle(september, new Error("failed"), true);
  expect(state.dashboard).toBeNull();
  expect(state.loading).toBe(false);
  expect(state.error).toBe("Não foi possível carregar o painel de guardador.");
  expect(onError).toHaveBeenCalledTimes(1);
  act(() => state.reload());
  expect(state.error).toBe("");
  expect(state.loading).toBe(true);
  await settle(retry, { month: "2026-09", monthlyPayments: [] });
  expect(state.dashboard.monthlyPayments).toEqual([]);
});

it.each([false, true])(
  "ignores obsolete completion (failure=%s) while the current month loads",
  async (failure) => {
    const august = deferred();
    const september = deferred();
    getAgentesDashboard
      .mockReturnValueOnce(august.promise)
      .mockReturnValueOnce(september.promise);
    render("2026-08");
    render("2026-09");
    await settle(
      august,
      failure ? new Error("old error") : { month: "2026-08" },
      failure
    );
    expect(state.loading).toBe(true);
    expect(state.dashboard).toBeNull();
    expect(state.error).toBe("");
    expect(onError).not.toHaveBeenCalled();
    await settle(september, { month: "2026-09", monthlyPayments: [] });
    expect(state.loading).toBe(false);
  }
);

it("ignores a pending error after unmount", async () => {
  const request = deferred();
  getAgentesDashboard.mockReturnValueOnce(request.promise);
  render("2026-08");
  act(() => root.render(null));
  await settle(request, new Error("late failure"), true);
  expect(onError).not.toHaveBeenCalled();
});

it("does not request data without access and ignores a previous agent response", async () => {
  render("2026-08", { enabled: false });
  expect(getAgentesDashboard).not.toHaveBeenCalled();
  const first = deferred();
  const second = deferred();
  getAgentesDashboard
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  render("2026-08");
  render("2026-08", { id: "8" });
  await settle(second, { userId: 8, monthlyPayments: [] });
  await settle(first, {
    userId: 7,
    monthlyPayments: [{ totalPaymentValue: 271.6 }],
  });
  expect(state.dashboard.userId).toBe(8);
});
