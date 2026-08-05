# Agents Dashboard API Contract

## Purpose

This document defines the backend contract for the agents dashboard endpoint in its updated form, including the new date reference selector used by the frontend to switch between:

- `tentative`: grouped by tentative payment date
- `effective`: grouped by effective settlement date

This contract is intended to be the source of truth for frontend implementation.

## Endpoint

`GET /v1/agentes/dashboard`

## Authentication

Requires a valid JWT bearer token.

## Authorization

- `master` and `admin` may query any agent through `userId`
- `agentes` may only query their own dashboard

## Query Parameters

| Name | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `month` | `YYYY-MM` string | yes | `2026-05` | Reference month for the selected `dateType` |
| `dateType` | `'tentative' \| 'effective'` | no | `effective` | Defaults to `tentative` |
| `paymentDate` | `YYYY-MM-DD` string | no | `2026-05-20` | Must belong to the selected `month` and active `dateType` |
| `workDate` | `YYYY-MM-DD` string | no | `2026-05-15` | Requires `paymentDate` |
| `userId` | number | no | `123` | Optional for admins; ignored for agents querying another user |

## Date Semantics

### `dateType = tentative`

- Monthly grouping uses `ordem_pagamento_agrupado.dataPagamento`
- Available months are derived from grouped payment dates
- Pending and awaiting-payment entries may appear in this mode

### `dateType = effective`

- Monthly grouping uses `detalhe_a.dataEfetivacao`
- Available months are derived from effective settlement dates
- Only entries with an effective payment date are returned in this mode

## Response Shape

```ts
type DashboardDateType = 'tentative' | 'effective';

type PaymentDayType = 'terça-feira' | 'sexta-feira' | 'outro';

type AgentAssociationOption = {
  value: number;
  label: string;
  cpfCnpj: string | null;
};

type RejectionReasonSummary = {
  reason: string;
  count: number;
};

type MonthlyPaymentSummary = {
  paymentDate: string; // YYYY-MM-DD
  paymentDayType: PaymentDayType;
  validPhotosCount: number;
  rejectedPhotosCount: number;
  paymentStatus: 'Pago' | 'Rejeitado' | 'Aguardando Pagamento' | 'Estorno';
  pendingReason: string | null;
  totalPaymentValue: number;
  coveredDaysCount: number;
};

type WeeklyDaySummary = {
  date: string; // YYYY-MM-DD
  periodLabel: string; // currently "Integral"
  validPhotosCount: number;
  rejectedPhotosCount: number;
  paymentStatus: 'Pago' | 'Rejeitado' | 'Aguardando Pagamento' | 'Estorno';
  pendingReason: string | null;
  totalPaymentValue: number;
};

type SelectedPaymentWeek = {
  paymentDate: string; // YYYY-MM-DD
  paymentDayType: PaymentDayType;
  days: WeeklyDaySummary[];
  totalPaymentValue: number;
};

type SelectedWorkDayPhoto = {
  id: string;
  capturedAt: string; // ISO datetime
  description: string;
  status: 'Pago' | 'Rejeitado' | 'Aguardando Pagamento';
  amount: number;
  rejectionReason: string | null;
};

type SelectedWorkDayPhotos = {
  paymentDate: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  periodLabel: string;
  photos: SelectedWorkDayPhoto[];
};

type MonthlySummary = {
  daysWithPayments: number;
  totalPayments: number;
  totalPaidEntries: number;
  totalRejectedEntries: number;
  totalPaymentValue: number;
};

type AgentsDashboardResponse = {
  userId: number;
  month: string; // YYYY-MM
  dateType: DashboardDateType;
  availableMonths: string[]; // YYYY-MM[]
  associacoes: AgentAssociationOption[];
  currentView: 'monthly' | 'weekly' | 'daily';
  validPhotosCount: number;
  rejectedPhotosCount: number;
  rejectionReasons: RejectionReasonSummary[];
  consolidatedPaymentValue: number;
  monthlySummary: MonthlySummary;
  monthlyPayments: MonthlyPaymentSummary[];
  selectedPaymentWeek?: SelectedPaymentWeek;
  selectedWorkDayPhotos?: SelectedWorkDayPhotos;
};
```

## View Rules

### Monthly View

Request:

```http
GET /v1/agentes/dashboard?month=2026-05&dateType=tentative
```

Response behavior:

- `currentView = "monthly"`
- `monthlyPayments` is populated
- `selectedPaymentWeek` is absent
- `selectedWorkDayPhotos` is absent

### Weekly View

Request:

```http
GET /v1/agentes/dashboard?month=2026-05&dateType=effective&paymentDate=2026-05-20
```

Response behavior:

- `currentView = "weekly"`
- `selectedPaymentWeek` is populated
- `selectedWorkDayPhotos` is absent

### Daily View

Request:

```http
GET /v1/agentes/dashboard?month=2026-05&dateType=effective&paymentDate=2026-05-20&workDate=2026-05-15
```

Response behavior:

- `currentView = "daily"`
- `selectedPaymentWeek` is populated
- `selectedWorkDayPhotos` is populated

## Example Response

```json
{
  "userId": 12,
  "month": "2026-05",
  "dateType": "effective",
  "availableMonths": ["2026-05", "2026-04"],
  "associacoes": [
    {
      "value": 10,
      "label": "Flamengo",
      "cpfCnpj": "12345678000100"
    }
  ],
  "currentView": "weekly",
  "validPhotosCount": 3,
  "rejectedPhotosCount": 0,
  "rejectionReasons": [],
  "consolidatedPaymentValue": 90,
  "monthlySummary": {
    "daysWithPayments": 1,
    "totalPayments": 1,
    "totalPaidEntries": 1,
    "totalRejectedEntries": 0,
    "totalPaymentValue": 90
  },
  "monthlyPayments": [
    {
      "paymentDate": "2026-05-20",
      "paymentDayType": "outro",
      "validPhotosCount": 3,
      "rejectedPhotosCount": 0,
      "paymentStatus": "Pago",
      "pendingReason": null,
      "totalPaymentValue": 90,
      "coveredDaysCount": 1
    }
  ],
  "selectedPaymentWeek": {
    "paymentDate": "2026-05-20",
    "paymentDayType": "outro",
    "days": [
      {
        "date": "2026-05-15",
        "periodLabel": "Integral",
        "validPhotosCount": 3,
        "rejectedPhotosCount": 0,
        "paymentStatus": "Pago",
        "pendingReason": null,
        "totalPaymentValue": 90
      }
    ],
    "totalPaymentValue": 90
  }
}
```

## Frontend Integration Notes

- The frontend must always send `month`
- The frontend should send `dateType` explicitly, even though the backend defaults to `tentative`
- The frontend must use `dateType` returned by the response as the active source of truth for the current screen state
- `availableMonths` must be reloaded from the response when `dateType` changes
- `paymentDate` values from `monthlyPayments` must be reused when drilling into weekly view
- `workDate` values from `selectedPaymentWeek.days` must be reused when drilling into daily view
- The frontend must not assume that `effective` mode contains pending entries
- The frontend must not implement `pendência paga` behavior from this contract

## Validation Rules

- `paymentDate` outside the selected `month` returns `400`
- `workDate` without `paymentDate` returns `400`
- `workDate` not belonging to the selected payment cycle returns `400`
- Agents trying to read another agent's dashboard return `403`

## Out of Scope

- `pendência paga` for agents
- Any alternative endpoint for the same dashboard
- Any response field not described in this contract
