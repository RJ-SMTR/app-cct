export const AGENTES_DASHBOARD_DATE_TYPES = ["tentative", "effective"];
export const DEFAULT_AGENTES_DASHBOARD_DATE_TYPE = "tentative";

export const AGENTES_DASHBOARD_VIEWS = ["monthly", "weekly", "daily"];
export const DEFAULT_AGENTES_DASHBOARD_VIEW = "monthly";

export function normalizeDashboardDateType(dateType) {
  return AGENTES_DASHBOARD_DATE_TYPES.includes(dateType)
    ? dateType
    : DEFAULT_AGENTES_DASHBOARD_DATE_TYPE;
}

export function normalizeDashboardView(view) {
  return AGENTES_DASHBOARD_VIEWS.includes(view)
    ? view
    : DEFAULT_AGENTES_DASHBOARD_VIEW;
}

/**
 * @typedef {'tentative' | 'effective'} DashboardDateType
 * @typedef {'monthly' | 'weekly' | 'daily'} DashboardCurrentView
 * @typedef {'terça-feira' | 'sexta-feira' | 'outro'} PaymentDayType
 * @typedef {'Pago' | 'Rejeitado' | 'Aguardando Pagamento' | 'Estorno'} DashboardPaymentStatus
 *
 * @typedef {{
 *   value: number,
 *   label: string,
 *   cpfCnpj: string | null,
 * }} AgentAssociationOption
 *
 * @typedef {{
 *   reason: string,
 *   count: number,
 * }} RejectionReasonSummary
 *
 * @typedef {{
 *   paymentDate: string,
 *   paymentDayType: PaymentDayType,
 *   validPhotosCount: number,
 *   rejectedPhotosCount: number,
 *   paymentStatus: DashboardPaymentStatus,
 *   pendingReason: string | null,
 *   totalPaymentValue: number,
 *   coveredDaysCount: number,
 * }} MonthlyPaymentSummary
 *
 * @typedef {{
 *   date: string,
 *   periodLabel: string,
 *   validPhotosCount: number,
 *   rejectedPhotosCount: number,
 *   paymentStatus: DashboardPaymentStatus,
 *   pendingReason: string | null,
 *   totalPaymentValue: number,
 * }} WeeklyDaySummary
 *
 * @typedef {{
 *   paymentDate: string,
 *   paymentDayType: PaymentDayType,
 *   days: WeeklyDaySummary[],
 *   totalPaymentValue: number,
 * }} SelectedPaymentWeek
 *
 * @typedef {{
 *   id: string,
 *   capturedAt: string,
 *   description: string,
 *   status: 'Pago' | 'Rejeitado' | 'Aguardando Pagamento',
 *   amount: number,
 *   rejectionReason: string | null,
 * }} SelectedWorkDayPhoto
 *
 * @typedef {{
 *   paymentDate: string,
 *   date: string,
 *   periodLabel: string,
 *   photos: SelectedWorkDayPhoto[],
 * }} SelectedWorkDayPhotos
 *
 * @typedef {{
 *   daysWithPayments: number,
 *   totalPayments: number,
 *   totalPaidEntries: number,
 *   totalRejectedEntries: number,
 *   totalPaymentValue: number,
 * }} MonthlySummary
 *
 * @typedef {{
 *   userId: number,
 *   month: string,
 *   dateType: DashboardDateType,
 *   availableMonths: string[],
 *   associacoes: AgentAssociationOption[],
 *   currentView: DashboardCurrentView,
 *   validPhotosCount: number,
 *   rejectedPhotosCount: number,
 *   rejectionReasons: RejectionReasonSummary[],
 *   consolidatedPaymentValue: number,
 *   monthlySummary: MonthlySummary,
 *   monthlyPayments: MonthlyPaymentSummary[],
 *   selectedPaymentWeek?: SelectedPaymentWeek | null,
 *   selectedWorkDayPhotos?: SelectedWorkDayPhotos | null,
 * }} AgentsDashboardResponse
 */
