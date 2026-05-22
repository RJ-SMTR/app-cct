import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
  Alert,
  Box,
  Badge,
  Button,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from 'app/configs/api/api';
import { selectUser } from 'app/store/userSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
import JwtService from 'src/app/auth/services/jwtService';
import { isAdminUser } from 'src/app/auth/utils/accessUtils';
import { BankInfo, PersonalInfo } from '../profile/formCards/formCards';
import useThemeMediaQuery from '../../../../@fuse/hooks/useThemeMediaQuery';
import MOCK_AGENT_USERS from './mocks/mockAgents';
import { DEFAULT_AGENTES_DASHBOARD_MONTH, getAgentesDashboard } from './services/agentesService';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
    '& > .container': {
      maxWidth: '100%',
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
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function getAgentCpf(agentUser) {
  return agentUser?.cpf || agentUser?.cpfCnpj || '-';
}

function getAgentAssociation(agentUser) {
  return (
    agentUser?.consorcio ||
    agentUser?.consorcioName ||
    agentUser?.association ||
    agentUser?.associacao ||
    '-'
  );
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
          <Typography className="mt-8 font-medium text-3xl leading-none">{value}</Typography>
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
  const normalizedStatus = String(status || '')
    .trim()
    .toLowerCase();

  if (normalizedStatus === 'pago') {
    return 'Pago';
  }

  if (normalizedStatus === 'rejeitado') {
    return 'Rejeitado';
  }

  return '';
}

function getMonthlyPaymentStatus(day) {
  const paymentStatuses = Array.isArray(day?.payments)
    ? day.payments.map((payment) => normalizePaymentStatus(payment?.status)).filter(Boolean)
    : [];

  if (paymentStatuses.includes('Pago')) {
    return 'Pago';
  }

  if (paymentStatuses.includes('Rejeitado')) {
    return 'Rejeitado';
  }

  return normalizePaymentStatus(day?.paymentStatus) || 'Rejeitado';
}

function MonthlyStatusBadge({ day }) {
  const status = getMonthlyPaymentStatus(day);

  return (
    <Badge
      className="whitespace-nowrap"
      color={status === 'Rejeitado' ? 'error' : 'success'}
      badgeContent={status}
    />
  );
}

function AgentesApp() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { id } = useParams();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
  const [selectedMonthDate, setSelectedMonthDate] = useState(
    buildMonthDate(DEFAULT_AGENTES_DASHBOARD_MONTH)
  );
  const [dashboard, setDashboard] = useState(null);
  const [agentDetails, setAgentDetails] = useState(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedMonth = useMemo(() => format(selectedMonthDate, 'yyyy-MM'), [selectedMonthDate]);
  const selectedDayData = useMemo(() => {
    return dashboard?.dailyPayments?.find((day) => day.date === selectedDay) || null;
  }, [dashboard, selectedDay]);
  const selectedMockAgent = MOCK_AGENT_USERS.find(
    (mockAgent) => String(mockAgent.id) === String(id)
  );
  const isOwnDashboard = String(user?.id) === String(id);
  const canAccessSelectedAgent = isAdminUser(user) || isOwnDashboard;
  const dashboardOwnerName =
    agentDetails?.fullName ||
    (isOwnDashboard ? user.fullName : null) ||
    selectedMockAgent?.fullName ||
    'Agente';
  const selectedDayLabel = selectedDayData
    ? format(new Date(`${selectedDayData.date}T12:00:00`), 'dd/MM/yyyy')
    : '';

  const loadAgentDetails = useCallback(async () => {
    if (selectedMockAgent) {
      setAgentDetails(selectedMockAgent);
    }

    const token = window.localStorage.getItem('jwt_access_token');

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
      if (!selectedMockAgent) {
        dispatch(
          showMessage({
            message: 'Não foi possível carregar os dados do agente.',
          })
        );
      }
    }
  }, [dispatch, id, selectedMockAgent]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getAgentesDashboard(id, selectedMonth);
      setDashboard(response);
      setSelectedDay((currentSelectedDay) => {
        if (response.dailyPayments.some((day) => day.date === currentSelectedDay)) {
          return currentSelectedDay;
        }

        return '';
      });
    } catch (requestError) {
      setError('Não foi possível carregar o painel de agentes.');
      dispatch(
        showMessage({
          message: 'Não foi possível carregar o painel de agentes.',
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
    loadDashboard();
  }, [canAccessSelectedAgent, loadAgentDetails, loadDashboard]);

  const handleSelectedMonth = (newValue) => {
    if (!newValue) {
      return;
    }

    setSelectedMonthDate(newValue);
    setSelectedDay('');
  };

  let dailyPaymentsRows = <EmptyState message="Não há pagamentos para o mês selecionado." />;

  if (loading) {
    dailyPaymentsRows = [...Array(4)].map((_, index) => (
      <TableRow key={`loading-day-${index}`}>
        <TableCell colSpan={5}>
          <Skeleton variant="text" height={28} />
        </TableCell>
      </TableRow>
    ));
  } else if (dashboard?.dailyPayments?.length) {
    dailyPaymentsRows = dashboard.dailyPayments.map((day) => {
      const isSelected = selectedDay === day.date;

      return (
        <TableRow
          key={day.date}
          hover
          selected={isSelected}
          onClick={() => setSelectedDay(day.date)}
          className="cursor-pointer"
        >
          <TableCell>{format(new Date(`${day.date}T12:00:00`), 'dd/MM/yyyy')}</TableCell>
          <TableCell>{day.validPhotosCount}</TableCell>
          <TableCell>{day.rejectedPhotosCount}</TableCell>
          <TableCell>{formatCurrency(day.totalPaymentValue)}</TableCell>
          <TableCell>
            <MonthlyStatusBadge day={day} />
          </TableCell>
        </TableRow>
      );
    });
  }

  let rejectionReasonRows = (
    <EmptyState message="Não há rejeições no período selecionado." colSpan={2} />
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

  let selectedDayPaymentRows = <EmptyState message="Nenhum dia selecionado para detalhamento." />;

  if (loading) {
    selectedDayPaymentRows = [...Array(3)].map((_, index) => (
      <TableRow key={`loading-payment-${index}`}>
        <TableCell colSpan={5}>
          <Skeleton variant="text" height={28} />
        </TableCell>
      </TableRow>
    ));
  } else if (selectedDayData?.payments?.length) {
    selectedDayPaymentRows = selectedDayData.payments.map((payment, index) => (
      <TableRow key={payment.id || `${payment.description}-${payment.date}-${index}`}>
        <TableCell>
          {payment.date ? format(new Date(`${payment.date}T12:00:00`), 'dd/MM/yyyy') : '-'}
        </TableCell>
        <TableCell>{payment.description}</TableCell>
        <TableCell>{formatCurrency(payment.amount)}</TableCell>
        <TableCell>{payment.status}</TableCell>
        <TableCell>{payment.rejectionReason || '-'}</TableCell>
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
          <img
            className="h-160 lg:h-320 object-cover w-full"
            src="assets/images/pages/profile/cover.jpg"
            alt="Profile Cover"
          />

          <div className="flex flex-col justify-center max-w-[95%] w-full mx-auto px-32 py-24 lg:h-72">
            <div className="flex flex-col items-start my-16">
              <Typography className="text-lg font-bold leading-none">
                {dashboardOwnerName}
              </Typography>
              <Typography color="text.secondary">#{id}</Typography>
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
              <PersonalInfo user={agentDetails} />
              <BankInfo user={agentDetails} />
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
            <Paper className="xl:col-span-2 flex flex-col flex-auto p-16 rounded-2xl shadow overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-16">
                <div>
                  <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                    Visão mensal
                  </Typography>
                  <Typography color="text.secondary">
                    Selecione um mês para ver os pagamentos diários consolidados.
                  </Typography>
                </div>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                  <MobileDatePicker
                    label="Selecionar Mês"
                    openTo="month"
                    closeOnSelect
                    views={['year', 'month']}
                    value={selectedMonthDate}
                    onChange={handleSelectedMonth}
                  />
                </LocalizationProvider>
              </div>

              <TableContainer sx={{ maxHeight: 440 }} className="mt-24">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Fotos válidas</TableCell>
                      <TableCell>Fotos rejeitadas</TableCell>
                      <TableCell>Valor total</TableCell>
                      <TableCell>Status sobre o pagamento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{dailyPaymentsRows}</TableBody>
                </Table>
              </TableContainer>
            </Paper>

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

          <Paper className="flex flex-col flex-auto p-16 rounded-2xl shadow overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                  Registros do dia
                </Typography>
                <Typography color="text.secondary">
                  {selectedDayData
                    ? `Detalhamento de ${selectedDayLabel}.`
                    : 'Clique em uma data na visão mensal para ver os registros do dia.'}
                </Typography>
              </div>

              {selectedDayData ? (
                <Typography className="font-medium text-base">
                  Total do dia: {formatCurrency(selectedDayData.totalPaymentValue)}
                </Typography>
              ) : null}
            </div>

            <TableContainer sx={{ maxHeight: 420 }} className="mt-24">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Status sobre o pagamento</TableCell>
                    <TableCell>Motivo da rejeição</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{selectedDayPaymentRows}</TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </div>
      }
      scroll={isMobile ? 'normal' : 'page'}
    />
  );
}

export default AgentesApp;
