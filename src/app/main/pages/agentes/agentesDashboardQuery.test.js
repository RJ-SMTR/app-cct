import {
  areAgentesDashboardQueriesEqual,
  createAgentesDashboardQuery,
  resolveAgentesDashboardQuery,
} from "./agentesDashboardQuery";

describe("agentesDashboardQuery", () => {
  it("drops workDate when there is no selected paymentDate", () => {
    expect(
      createAgentesDashboardQuery({
        month: "2026-08",
        dateType: "effective",
        workDate: "2026-08-15",
      })
    ).toEqual({
      month: "2026-08",
      dateType: "effective",
      paymentDate: "",
      workDate: "",
    });
  });

  it("clears drill-down params when the response returns to monthly view", () => {
    expect(
      resolveAgentesDashboardQuery(
        {
          month: "2026-08",
          dateType: "tentative",
          paymentDate: "2026-08-20",
          workDate: "2026-08-15",
        },
        {
          dateType: "effective",
          currentView: "monthly",
          availableMonths: ["2026-08", "2026-07"],
        }
      )
    ).toEqual({
      month: "2026-08",
      dateType: "effective",
      paymentDate: "",
      workDate: "",
    });
  });

  it("uses selected work day details when the response is in daily view", () => {
    expect(
      resolveAgentesDashboardQuery(
        {
          month: "2026-09",
          dateType: "effective",
          paymentDate: "2026-09-20",
          workDate: "",
        },
        {
          dateType: "effective",
          currentView: "daily",
          availableMonths: ["2026-08"],
          selectedPaymentWeek: {
            paymentDate: "2026-08-20",
          },
          selectedWorkDayPhotos: {
            paymentDate: "2026-08-20",
            date: "2026-08-15",
          },
        }
      )
    ).toEqual({
      month: "2026-08",
      dateType: "effective",
      paymentDate: "2026-08-20",
      workDate: "2026-08-15",
    });
  });

  it("compares normalized queries rather than raw objects", () => {
    expect(
      areAgentesDashboardQueriesEqual(
        {
          month: "2026-08",
          dateType: "tentative",
          paymentDate: "",
          workDate: "2026-08-15",
        },
        {
          month: "2026-08",
          dateType: "tentative",
          paymentDate: "",
          workDate: "",
        }
      )
    ).toBe(true);
  });
});
