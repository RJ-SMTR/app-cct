import FusePageSimple from "@fuse/core/FusePageSimple";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { styled } from "@mui/material/styles";
import {
  Alert,
  Box,
  Badge,
  Button,
  Card,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { MobileDatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, isValid, parseISO } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useParams } from "react-router-dom";
import { api } from "app/configs/api/api";
import { selectUser } from "app/store/userSlice";
import { showMessage } from "app/store/fuse/messageSlice";
import JwtService from "src/app/auth/services/jwtService";
import { isAdminUser } from "src/app/auth/utils/accessUtils";
import { getUserCpf, PersonalInfo } from "../profile/formCards/formCards";
import {
  DEFAULT_AGENTES_DASHBOARD_MONTH,
  getAgentesDashboard,
} from "./services/agentesService";

const Root = styled(FusePageSimple)(({ theme }) => ({
  "& .FusePageSimple-header": {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.divider,
    "& > .container": {
      maxWidth: "100%",
    },
  },
}));

function buildMonthDate(month) {
  if (!month) {
    return new Date();
  }

  return new Date(`${month}-01T12:00:00`);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function SummaryCard({ title, value, icon, loading }) {
  return (
    <Paper className="relative flex flex-col flex-auto p-16 rounded-2xl shadow overflow-hidden min-h-[140px]">
      <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
        {title}
      </Typography>
      <div className="flex flex-row flex-wrap mt-12">
        {loading ? (
          <Skeleton variant="text" width={140} height={42} />
        ) : (
          <Typography className="mt-8 font-medium text-3xl leading-none">
            {value}
          </Typography>
        )}
      </div>
      <div className="absolute bottom-0 ltr:right-0 rtl:left-0 w-96 h-96 -m-24">
        <FuseSvgIcon size={88} className="opacity-20 text-[#004A80]">
          {icon}
        </FuseSvgIcon>
      </div>
    </Paper>
  );
}

function EmptyState({ message, colSpan = 5 }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Typography color="text.secondary">{message}</Typography>
      </TableCell>
    </TableRow>
  );
}

function normalizePaymentStatus(status) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  if (normalizedStatus === "pago") {
    return "Pago";
  }

  if (normalizedStatus === "rejeitado") {
    return "Rejeitado";
  }

  return "";
}

function formatDateLabel(date) {
  const parsedDate = parseDateValue(date);

  if (!parsedDate) {
    return "-";
  }

  return format(parsedDate, "dd/MM/yyyy");
}

function normalizeDateValue(dateValue) {
  if (typeof dateValue !== "string") {
    return "";
  }

  const normalizedDateValue = dateValue.trim();

  if (!normalizedDateValue) {
    return "";
  }

  const lowerCaseDateValue = normalizedDateValue.toLowerCase();

  if (lowerCaseDateValue === "null" || lowerCaseDateValue === "undefined") {
    return "";
  }

  return normalizedDateValue;
}

function parseDateValue(dateValue) {
  const normalizedDateValue = normalizeDateValue(dateValue);

  if (!normalizedDateValue) {
    return null;
  }

  const isoDateValue = normalizedDateValue.includes("T")
    ? normalizedDateValue
    : `${normalizedDateValue}T12:00:00`;
  const parsedDateValue = parseISO(isoDateValue);

  return isValid(parsedDateValue) ? parsedDateValue : null;
}

function formatDateTimeLabel(dateTime, dateFormat = "dd/MM/yyyy HH:mm") {
  const parsedDateTime = parseDateValue(dateTime);

  if (!parsedDateTime) {
    return "-";
  }

  return format(parsedDateTime, dateFormat);
}

function getInviteSentAt(user) {
  return user?.inviteAt || "";
}
function StatusBadge({ status }) {
  const normalizedStatus = normalizePaymentStatus(status);
  const badgeStatus = normalizedStatus || status || "Rejeitado";
  let badgeColor = "success";

  if (normalizedStatus === "Rejeitado") {
    badgeColor = "error";
  } else if (String(badgeStatus || "").toLowerCase().includes("estorno")) {
    badgeColor = "warning";
  }

  return (
    <Badge
      className="whitespace-nowrap"
      color={badgeColor}
      badgeContent={badgeStatus}
    />
  );
}

function isPendingPaymentStatus(status) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  return normalizedStatus === "rejeitado" || normalizedStatus === "estorno";
}

function formatPhotoCount(count) {
  const parsedCount = Number(count);

  return Number.isFinite(parsedCount) ? parsedCount : 0;
}

function getTotalPhotosCount(validPhotosCount, rejectedPhotosCount) {
  return (
    formatPhotoCount(validPhotosCount) + formatPhotoCount(rejectedPhotosCount)
  );
}

function ValidPhotosStatusBadge({ status, pendingReason }) {
  if (!isPendingPaymentStatus(status)) {
    return <StatusBadge status={status} />;
  }

  return (
    <Tooltip
      title={pendingReason || "Pendente"}
      arrow
      enterTouchDelay={10}
      leaveTouchDelay={10000}
    >
      <Badge
        className="whitespace-nowrap"
        color="error"
        badgeContent={
          <span className="inline-flex items-center gap-4 underline">
            Pendentes <InfoOutlinedIcon fontSize="small" />
          </span>
        }
      />
    </Tooltip>
  );
}

function AgentBankInfo({ user }) {
  const [bankCode, setBankCode] = useState();
  const [previousBank, setPreviousBank] = useState();
  const [bankRm, setBankRm] = useState(false);

  useEffect(() => {
    const bankCodes = [184, 29, 479, 386, 249];

    if (!user) {
      return;
    }

    if (user.aux_bank != null) {
      setBankCode(`${user.bankCode} - ${user.aux_bank.name}`);
    } else {
      setBankCode(user.bankCode);
    }

    async function fetchBanks() {
      try {
        const response = await api.get("/banks");
        const bankList = response.data;

        if (user.previousBankCode) {
          const matchedPreviousBank = bankList?.find(
            (bank) => bank.code === user.previousBankCode
          );

          if (matchedPreviousBank) {
            setPreviousBank(
              `${user.previousBankCode} - ${matchedPreviousBank.name}`
            );
          } else {
            setPreviousBank(user.previousBankCode);
          }
        } else {
          setPreviousBank(undefined);
        }

        setBankRm(bankCodes.includes(user.bankCode));
      } catch (requestError) {
        console.error("Erro ao buscar bancos:", requestError);
      }
    }

    fetchBanks();
  }, [user]);

  return (
    <Card className=" w-full md:mx-9 p-24 relative mt-24 md:mt-0">
      <header className="flex justify-between items-center">
        <h1 className="font-semibold">Dados Bancários</h1>
      </header>
      <form
        name="Bank"
        noValidate
        className="flex flex-col justify-center w-full mt-32"
      >
        <TextField
          value={bankCode ?? user.bankCode ?? ""}
          disabled
          label="Banco"
          className=""
          id="bank-autocomplete"
          variant="outlined"
        />
        {bankRm ? (
          <span className="my-10 text-red-600">
            Erro: Código do banco {user.bankCode} não é permitido. Por favor,
            contacte o suporte!
          </span>
        ) : null}

        <TextField
          value={user.bankAgency ?? ""}
          disabled
          className="my-24"
          label="Agência"
          type="string"
          variant="outlined"
          fullWidth
        />
        <Box className="flex justify-between">
          <TextField
            value={user.bankAccount ?? ""}
            disabled
            className="mb-24 w-[68%]"
            label="Conta"
            type="string"
            variant="outlined"
            fullWidth
          />

          <TextField
            value={user.bankAccountDigit ?? ""}
            disabled
            className="mb-24 w-[30%]"
            label="Dígito"
            type="string"
            variant="outlined"
            fullWidth
          />
        </Box>
      </form>
      <p className="text-red">
        Última atualização:{" "}
        {formatDateTimeLabel(user?.updatedAt, "dd/MM/yyyy HH:mm:ss")}
      </p>
      {previousBank ? <p>Banco anterior: {previousBank}</p> : null}
    </Card>
  );
}

const DashboardDrilldownCard = memo(function DashboardDrilldownCard({
  agentId,
  selectedMonth,
  selectedMonthDate,
  monthlyPayments,
  monthlyLoading,
  onMonthChange,
}) {
  const dispatch = useDispatch();
  const [selectedPaymentDate, setSelectedPaymentDate] = useState("");
  const [selectedWorkDate, setSelectedWorkDate] = useState("");
  const [selectedPaymentWeek, setSelectedPaymentWeek] = useState(null);
  const [selectedWorkDayPhotos, setSelectedWorkDayPhotos] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownError, setDrilldownError] = useState("");

  useEffect(() => {
    setSelectedPaymentDate("");
    setSelectedWorkDate("");
    setSelectedPaymentWeek(null);
    setSelectedWorkDayPhotos(null);
    setDrilldownLoading(false);
    setDrilldownError("");
  }, [selectedMonth]);

  const handleDrilldownError = useCallback(
    (message) => {
      setDrilldownError(message);
      dispatch(
        showMessage({
          message,
        })
      );
    },
    [dispatch]
  );

  const loadWeeklyView = useCallback(
    async (paymentDate) => {
      setDrilldownLoading(true);
      setDrilldownError("");

      try {
        const response = await getAgentesDashboard(
          agentId,
          selectedMonth,
          paymentDate
        );

        setSelectedPaymentDate(paymentDate);
        setSelectedWorkDate("");
        setSelectedPaymentWeek(response.selectedPaymentWeek || null);
        setSelectedWorkDayPhotos(null);
      } catch (requestError) {
        handleDrilldownError(
          "Não foi possível carregar a visão semanal deste pagamento."
        );
      } finally {
        setDrilldownLoading(false);
      }
    },
    [agentId, handleDrilldownError, selectedMonth]
  );

  const loadDailyView = useCallback(
    async (paymentDate, workDate) => {
      setDrilldownLoading(true);
      setDrilldownError("");

      try {
        const response = await getAgentesDashboard(
          agentId,
          selectedMonth,
          paymentDate,
          workDate
        );

        setSelectedPaymentDate(paymentDate);
        setSelectedWorkDate(workDate);
        setSelectedPaymentWeek(response.selectedPaymentWeek || null);
        setSelectedWorkDayPhotos(response.selectedWorkDayPhotos || null);
      } catch (requestError) {
        handleDrilldownError(
          "Não foi possível carregar as fotos do dia selecionado."
        );
      } finally {
        setDrilldownLoading(false);
      }
    },
    [agentId, handleDrilldownError, selectedMonth]
  );

  const handleSelectMonthlyPayment = useCallback(
    (paymentDate) => {
      loadWeeklyView(paymentDate);
    },
    [loadWeeklyView]
  );

  const handleSelectWeeklyDay = useCallback(
    (workDate) => {
      if (!selectedPaymentDate) {
        return;
      }

      loadDailyView(selectedPaymentDate, workDate);
    },
    [loadDailyView, selectedPaymentDate]
  );

  const handleBackToMonthly = useCallback(() => {
    setSelectedPaymentDate("");
    setSelectedWorkDate("");
    setSelectedPaymentWeek(null);
    setSelectedWorkDayPhotos(null);
    setDrilldownLoading(false);
    setDrilldownError("");
  }, []);

  const handleBackToWeekly = useCallback(() => {
    setSelectedWorkDate("");
    setSelectedWorkDayPhotos(null);
    setDrilldownLoading(false);
    setDrilldownError("");
  }, []);

  let monthlyPaymentsRows = (
    <EmptyState
      message="Não há pagamentos para o mês selecionado."
      colSpan={6}
    />
  );

  if (monthlyLoading) {
    monthlyPaymentsRows = [...Array(4)].map((_, index) => (
      <TableRow key={`loading-payment-cycle-${index}`}>
        <TableCell colSpan={6}>
          <Skeleton variant="text" height={28} />
        </TableCell>
      </TableRow>
    ));
  } else if (monthlyPayments?.length) {
    monthlyPaymentsRows = monthlyPayments.map((payment) => {
      const isSelected = selectedPaymentDate === payment.paymentDate;
      const totalPhotosCount = getTotalPhotosCount(
        payment.validPhotosCount,
        payment.rejectedPhotosCount
      );

      return (
        <TableRow
          key={payment.paymentDate}
          hover
          selected={isSelected}
          onClick={() => handleSelectMonthlyPayment(payment.paymentDate)}
          className="cursor-pointer"
        >
          <TableCell>{formatDateLabel(payment.paymentDate)}</TableCell>
          <TableCell>{totalPhotosCount}</TableCell>
          <TableCell>{payment.validPhotosCount}</TableCell>
          <TableCell>{formatCurrency(payment.totalPaymentValue)}</TableCell>
          <TableCell>
            <ValidPhotosStatusBadge
              status={payment.paymentStatus}
              pendingReason={payment.pendingReason}
            />
          </TableCell>
          <TableCell>{payment.rejectedPhotosCount}</TableCell>
        </TableRow>
      );
    });
  }

  let weeklyDayRows = (
    <EmptyState
      message="Nenhum dia encontrado para este pagamento."
      colSpan={6}
    />
  );

  if (drilldownLoading) {
    weeklyDayRows = [...Array(4)].map((_, index) => (
      <TableRow key={`loading-week-day-${index}`}>
        <TableCell colSpan={6}>
          <Skeleton variant="text" height={28} />
        </TableCell>
      </TableRow>
    ));
  } else if (selectedPaymentWeek?.days?.length) {
    weeklyDayRows = selectedPaymentWeek.days.map((day) => {
      const isSelected = selectedWorkDate === day.date;
      const totalPhotosCount = getTotalPhotosCount(
        day.validPhotosCount,
        day.rejectedPhotosCount
      );

      return (
        <TableRow
          key={`${day.date}-${day.periodLabel}`}
          hover
          selected={isSelected}
          onClick={() => handleSelectWeeklyDay(day.date)}
          className="cursor-pointer"
        >
          <TableCell>{formatDateLabel(day.date)}</TableCell>
          <TableCell>{totalPhotosCount}</TableCell>
          <TableCell>{day.validPhotosCount}</TableCell>
          <TableCell>{formatCurrency(day.totalPaymentValue)}</TableCell>
          <TableCell>
            <ValidPhotosStatusBadge
              status={day.paymentStatus}
              pendingReason={day.pendingReason}
            />
          </TableCell>
          <TableCell>{day.rejectedPhotosCount}</TableCell>
        </TableRow>
      );
    });
  }

  let selectedWorkDayPhotoRows = (
    <EmptyState message="Nenhuma foto encontrada para o dia selecionado." />
  );

  if (drilldownLoading) {
    selectedWorkDayPhotoRows = [...Array(4)].map((_, index) => (
      <TableRow key={`loading-photo-row-${index}`}>
        <TableCell colSpan={5}>
          <Skeleton variant="text" height={28} />
        </TableCell>
      </TableRow>
    ));
  } else if (selectedWorkDayPhotos?.photos?.length) {
    selectedWorkDayPhotoRows = selectedWorkDayPhotos.photos.map(
      (photo, index) => (
        <TableRow
          key={photo.id || `${photo.description}-${photo.capturedAt}-${index}`}
        >
          <TableCell>{formatDateTimeLabel(photo.capturedAt)}</TableCell>
          <TableCell>{formatCurrency(photo.amount)}</TableCell>
          <TableCell>
            {normalizePaymentStatus(photo.status) === "Pago" ? "-" : photo.status}
          </TableCell>
          <TableCell>{photo.rejectionReason || "-"}</TableCell>
        </TableRow>
      )
    );
  }

  let drilldownTitle = "Visão mensal";
  let drilldownSubtitle =
    "Selecione um mês para ver os pagamentos diários consolidados.";
  let tableContent = (
    <>
      <TableHead>
        <TableRow>
          <TableCell>Data Pagamento</TableCell>
          <TableCell>Total fotos</TableCell>
          <TableCell>Fotos Válidas</TableCell>
          <TableCell>Valor Fotos Válidas</TableCell>
          <TableCell>Status Fotos Válidas</TableCell>
          <TableCell>Fotos NÃO Válidas</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{monthlyPaymentsRows}</TableBody>
    </>
  );

  if (selectedPaymentDate) {
    if (selectedWorkDate) {
      drilldownTitle = "Fotos do dia";
      drilldownSubtitle = `Detalhamento de ${formatDateLabel(selectedWorkDate)} (${selectedWorkDayPhotos?.periodLabel || "-"
        }).`;
      tableContent = (
        <>
          <TableHead>
            <TableRow>
              <TableCell>Capturada em</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Status </TableCell>
              <TableCell>Motivo da rejeição</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{selectedWorkDayPhotoRows}</TableBody>
        </>
      );
    } else {
      drilldownTitle = "Visão semanal";
      drilldownSubtitle = `Pagamento de ${formatDateLabel(selectedPaymentDate)} (${selectedPaymentWeek?.paymentDayType || "-"
        }).`;
      tableContent = (
        <>
          <TableHead>
            <TableRow>
              <TableCell>Data Pagamento</TableCell>
              <TableCell>Total fotos</TableCell>
              <TableCell>Fotos Válidas</TableCell>
              <TableCell>Valor Fotos Válidas</TableCell>
              <TableCell>Status Fotos Válidas</TableCell>
              <TableCell>Fotos NÃO Válidas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{weeklyDayRows}</TableBody>
        </>
      );
    }
  }

  return (
    <Paper className="xl:col-span-2 flex flex-col flex-auto p-16 rounded-2xl shadow overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-16">
        <div>
          <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
            {drilldownTitle}
          </Typography>
          <Typography color="text.secondary">{drilldownSubtitle}</Typography>
        </div>

        {!selectedPaymentDate ? (
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ptBR}
          >
            <MobileDatePicker
              label="Selecionar Mês"
              openTo="month"
              closeOnSelect
              views={["year", "month"]}
              value={selectedMonthDate}
              onChange={onMonthChange}
            />
          </LocalizationProvider>
        ) : (
          <div className="flex flex-wrap gap-8">
            {selectedWorkDate ? (
              <Button color="secondary" onClick={handleBackToWeekly}>
                Voltar para semana
              </Button>
            ) : null}

            <Button color="secondary" onClick={handleBackToMonthly}>
              Voltar para visão mensal
            </Button>
          </div>
        )}
      </div>

      {drilldownError ? (
        <Alert severity="error" className="mt-16">
          {drilldownError}
        </Alert>
      ) : null}

      <TableContainer sx={{ maxHeight: 440 }} className="mt-24">
        <Table stickyHeader>{tableContent}</Table>
      </TableContainer>

      {selectedPaymentDate && !selectedWorkDate ? (
        <Typography className="font-medium text-base mt-16 self-end">
          Total do pagamento:{" "}
          {formatCurrency(selectedPaymentWeek?.totalPaymentValue)}
        </Typography>
      ) : null}
    </Paper>
  );
});

function AgentesApp() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { id } = useParams();
  const [selectedMonthDate, setSelectedMonthDate] = useState(
    buildMonthDate(DEFAULT_AGENTES_DASHBOARD_MONTH)
  );
  const [dashboard, setDashboard] = useState(null);
  const [agentDetails, setAgentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedMonth = useMemo(
    () => format(selectedMonthDate, "yyyy-MM"),
    [selectedMonthDate]
  );
  const isOwnDashboard = String(user?.id) === String(id);
  const canAccessSelectedAgent = isAdminUser(user) || isOwnDashboard;
  const dashboardOwnerName =
    agentDetails?.fullName ||
    (isOwnDashboard ? user.fullName : null) ||
    "Agente";
  const agentCpf = getUserCpf(agentDetails);
  const inviteSentAt = getInviteSentAt(agentDetails);

  const loadAgentDetails = useCallback(async () => {
    if (isOwnDashboard) {
      setAgentDetails(user);
    }

    const token = window.localStorage.getItem("jwt_access_token");

    if (!JwtService.isAuthTokenValid(token)) {
      return;
    }

    try {
      const response = await api.get(`/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAgentDetails(response.data);
    } catch (requestError) {
      dispatch(
        showMessage({
          message: "Não foi possível carregar os dados do agente.",
        })
      );
    }
  }, [dispatch, id, isOwnDashboard, user]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAgentesDashboard(id, selectedMonth);

      if (
        response.availableMonths.length > 0 &&
        !response.availableMonths.includes(selectedMonth)
      ) {
        const latestAvailableMonth =
          response.availableMonths[response.availableMonths.length - 1];
        setSelectedMonthDate(buildMonthDate(latestAvailableMonth));
        return;
      }

      setDashboard(response);
    } catch (requestError) {
      setError("Não foi possível carregar o painel de agentes.");
      dispatch(
        showMessage({
          message: "Não foi possível carregar o painel de agentes.",
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, id, selectedMonth]);

  useEffect(() => {
    if (!canAccessSelectedAgent) {
      return;
    }

    loadAgentDetails();
  }, [canAccessSelectedAgent, loadAgentDetails]);

  useEffect(() => {
    if (!canAccessSelectedAgent) {
      return;
    }

    loadDashboard();
  }, [canAccessSelectedAgent, loadDashboard]);

  const handleSelectedMonth = (newValue) => {
    if (!newValue) {
      return;
    }

    setSelectedMonthDate(newValue);
  };

  let rejectionReasonRows = (
    <EmptyState
      message="Não há rejeições no período selecionado."
      colSpan={2}
    />
  );

  if (loading) {
    rejectionReasonRows = [...Array(4)].map((_, index) => (
      <TableRow key={`loading-reason-${index}`}>
        <TableCell colSpan={2}>
          <Skeleton variant="text" height={28} />
        </TableCell>
      </TableRow>
    ));
  } else if (dashboard?.rejectionReasons?.length) {
    rejectionReasonRows = dashboard.rejectionReasons.map((reason) => (
      <TableRow key={reason.reason}>
        <TableCell>{reason.reason}</TableCell>
        <TableCell>{reason.count}</TableCell>
      </TableRow>
    ));
  }

  if (!canAccessSelectedAgent) {
    return <Navigate to={`/agentes/${user?.id}`} replace />;
  }

  return (
    <Root
      header={
        <div className="flex flex-col">
          <div className="flex flex-col justify-center max-w-[95%] w-full mx-auto px-32 py-24 lg:h-72">
            <div className="flex flex-col gap-12 my-16 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col items-start">
                <Typography className="text-lg font-bold leading-none">
                  {dashboardOwnerName}
                </Typography>
                <Typography color="text.secondary">#{id}</Typography>
              </div>

              <div className="flex flex-col md:items-end">
                <Typography className="text-sm font-medium">
                  Convite enviado em
                </Typography>
                <Typography color="text.secondary">
                  {formatDateTimeLabel(inviteSentAt)}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      }
      content={
        <div className="flex flex-col max-w-[95%] w-full mx-auto my-32 gap-24">
          <div className="flex">
            <Link className="no-underline" to="/agentes">
              <Button
                variant="contained"
                color="secondary"
                className="z-10"
                aria-label="Voltar"
                size="medium"
                role="button"
              >
                Voltar
              </Button>
            </Link>
          </div>

          {agentDetails ? (
            <div className="flex flex-col md:flex-row">
              <PersonalInfo
                user={agentDetails}
                primaryInfoLabel="CPF"
                primaryInfoValue={agentCpf}
              />
              <AgentBankInfo user={agentDetails} />
            </div>
          ) : null}

          <Box className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <SummaryCard
              title="Fotos válidas"
              value={dashboard?.validPhotosCount ?? 0}
              icon="heroicons-outline:badge-check"
              loading={loading}
            />
            <SummaryCard
              title="Fotos rejeitadas"
              value={dashboard?.rejectedPhotosCount ?? 0}
              icon="heroicons-outline:x-circle"
              loading={loading}
            />
            <SummaryCard
              title="Valor consolidado"
              value={formatCurrency(dashboard?.consolidatedPaymentValue)}
              icon="heroicons-outline:currency-dollar"
              loading={loading}
            />
          </Box>

          {error ? (
            <Paper className="p-16 rounded-2xl shadow">
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={loadDashboard}>
                    Tentar novamente
                  </Button>
                }
              >
                {error}
              </Alert>
            </Paper>
          ) : null}

          <Box className="grid grid-cols-1 xl:grid-cols-3 gap-24">
            <DashboardDrilldownCard
              agentId={id}
              selectedMonth={selectedMonth}
              selectedMonthDate={selectedMonthDate}
              monthlyPayments={dashboard?.monthlyPayments || []}
              monthlyLoading={loading}
              onMonthChange={handleSelectedMonth}
            />

            <Paper className="flex flex-col flex-auto p-16 rounded-2xl shadow overflow-hidden">
              <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                Motivos de rejeição
              </Typography>
              <Typography color="text.secondary">
                Consolidação dos principais motivos no mês selecionado.
              </Typography>

              <TableContainer sx={{ maxHeight: 440 }} className="mt-24">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Quantidade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{rejectionReasonRows}</TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </div>
      }
      scroll="normal"
    />
  );
}

export default AgentesApp;
