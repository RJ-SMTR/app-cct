import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Button,
  Modal,
  Badge,
  Chip,
  Select,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TablePagination,
  TableRow,
  TextField,
  MenuItem,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
import { getAgentUsers } from 'app/store/adminSlice';
import { isAdminUser } from 'src/app/auth/utils/accessUtils';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  borderRadius: '.5rem',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function getAgentCpf(agentUser) {
  return agentUser?.cpf || agentUser?.cpfCnpj || '-';
}

function getAssociationLabel(association) {
  return association?.label || association?.name || association?.value || '';
}

const ASSOCIATION_CONNECTOR_WORDS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

function shortenAssociationLabel(label) {
  const normalizedLabel = String(label || '').trim();

  if (!normalizedLabel) {
    return '-';
  }

  const words = normalizedLabel.split(/\s+/);
  let significantWordsCount = 0;
  const shortenedWords = words.filter((word) => {
    if (significantWordsCount === 2) {
      return false;
    }

    if (!ASSOCIATION_CONNECTOR_WORDS.has(word.toLowerCase())) {
      significantWordsCount += 1;
    }

    return true;
  });

  return shortenedWords.join(' ');
}

function getAgentAssociation(agentUser) {
  if (Array.isArray(agentUser?.associacoes) && agentUser.associacoes.length > 0) {
    return agentUser.associacoes
      .map((association) => getAssociationLabel(association))
      .filter(Boolean)
      .join(', ');
  }

  return (
    agentUser?.consorcio ||
    agentUser?.consorcioName ||
    agentUser?.association ||
    agentUser?.associacao ||
    '-'
  );
}

function normalizeAgentList(agentUsers) {
  return Array.isArray(agentUsers) ? agentUsers : [];
}

function getAgentAssociationDisplay(agentUser) {
  if (Array.isArray(agentUser?.associacoes) && agentUser.associacoes.length > 0) {
    return agentUser.associacoes
      .map((association) => shortenAssociationLabel(getAssociationLabel(association)))
      .filter(Boolean)
      .join(', ');
  }

  return shortenAssociationLabel(getAgentAssociation(agentUser));
}

function getInviteStatusLabel(agentUser) {
  const inviteStatusName = agentUser?.inviteStatus?.name || agentUser?.aux_inviteStatus?.name;

  switch (inviteStatusName) {
    case 'created':
      return 'Criado';
    case 'sent':
      return 'Enviado';
    case 'used':
      return 'Acessado';
    default:
      return '';
  }
}

function AgentesHome() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const fetchedAgents = useSelector((state) => state.admin?.agentsList);
  const [allAgents, setAllAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      selectedQuery: '',
      query: '',
    },
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  useEffect(() => {
    if (!isAdminUser(user)) {
      setLoading(false);
      return;
    }

    setLoading(true);

    dispatch(getAgentUsers())
      .then((agentUsers) => {
        const normalizedAgents = normalizeAgentList(agentUsers);

        setAllAgents(normalizedAgents);
        setAgents(normalizedAgents);
      })
      .catch(() => {
        setAllAgents([]);
        setAgents([]);
        dispatch(
          showMessage({
            message: 'Não foi possível carregar o guardador.',
          })
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch, user]);

  useEffect(() => {
    const normalizedAgents = normalizeAgentList(fetchedAgents);

    setAllAgents(normalizedAgents);
    if (!filtered) {
      setAgents(normalizedAgents);
    }
  }, [fetchedAgents, filtered]);

  const onSubmit = ({ selectedQuery, query }) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!selectedQuery || !normalizedQuery) {
      return;
    }

    const filteredAgents = allAgents.filter((agentUser) => {
      let selectedValue = agentUser?.[selectedQuery];

      if (selectedQuery === 'cpf') {
        selectedValue = getAgentCpf(agentUser);
      }

      if (selectedQuery === 'consorcio') {
        selectedValue = getAgentAssociation(agentUser);
      }

      return String(selectedValue || '')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    setAgents(filteredAgents);
    setFiltered(true);
    setPage(0);
    handleClose();
    reset();
  };

  const removeFilters = () => {
    setAgents(allAgents);
    setFiltered(false);
    setPage(0);
  };

  let agentRows = (
    <TableRow>
      <TableCell colSpan={6}>Não há guardador para exibir.</TableCell>
    </TableRow>
  );

  if (loading) {
    agentRows = (
      <TableRow>
        <TableCell colSpan={6}>Carregando guardador...</TableCell>
      </TableRow>
    );
  } else if (agents.length > 0) {
    agentRows = agents
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((agentUser) => (
        <TableRow key={agentUser.id}>
          <TableCell>
            <Typography color="text.secondary">{getAgentCpf(agentUser)}</Typography>
          </TableCell>
          <TableCell>
            <Typography className="whitespace-nowrap">
              {agentUser.fullName ?? 'Guardador'}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography className="whitespace-nowrap">{agentUser.email}</Typography>
          </TableCell>
          <TableCell>
            <Typography className="whitespace-nowrap">
              <Badge
                className="top-[5px] mt-10"
                color={getInviteStatusLabel(agentUser) ? 'success' : 'warning'}
                badgeContent={getInviteStatusLabel(agentUser) ?? 'Convite não enviado'}
              />
            </Typography>
          </TableCell>
          <TableCell>
            <Box className="flex flex-wrap gap-8">
              {Array.isArray(agentUser?.associacoes) && agentUser.associacoes.length > 0 ? (
                agentUser.associacoes.map((association) => (
                  <Chip
                    key={`${agentUser.id}-${association.value}`}
                    label={shortenAssociationLabel(getAssociationLabel(association))}
                    size="small"
                  />
                ))
              ) : (
                <Typography className="whitespace-nowrap">
                  {getAgentAssociationDisplay(agentUser)}
                </Typography>
              )}
            </Box>
          </TableCell>
          <TableCell>
            <Link
              to={`/agentes/${agentUser.id}`}
              className="rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10"
            >
              Detalhes
            </Link>
          </TableCell>
        </TableRow>
      ));
  }

  if (!isAdminUser(user)) {
    return <Navigate to={`/agentes/${user?.id}`} replace />;
  }

  return (
    <div className="p-24 pt-10">
      <Typography className="font-medium text-3xl">Guardador</Typography>
      <Box className="flex flex-col justify-around">
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
          <div className="flex flex-row justify-between">
            <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
              Usuários
            </Typography>

            <div className="flex">
              {filtered ? (
                <Button className="mx-4" onClick={removeFilters}>
                  Remover filtros
                </Button>
              ) : null}

              <Button variant="contained" color="secondary" onClick={handleOpen}>
                Pesquisar usuários
              </Button>
            </div>
          </div>

          <TablePagination
            component="div"
            count={agents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            rowsPerPageOptions={[10, 50, 100, 250, 500, 1000]}
          />

          <TableContainer className="mt-24" sx={{ overflowX: 'auto' }}>
            <Table className="simple" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography
                      color="text.secondary"
                      className="font-semibold text-12 whitespace-nowrap"
                    >
                      CPF
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color="text.secondary"
                      className="font-semibold text-12 whitespace-nowrap"
                    >
                      Nome
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color="text.secondary"
                      className="font-semibold text-12 whitespace-nowrap"
                    >
                      E-mail
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color="text.secondary"
                      className="font-semibold text-12 whitespace-nowrap"
                    >
                      Status de convite
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color="text.secondary"
                      className="font-semibold text-12 whitespace-nowrap"
                    >
                      Associação
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>{agentRows}</TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={agents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            rowsPerPageOptions={[10, 50, 100, 250, 500, 1000]}
          />
        </Paper>
      </Box>
      <br />

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Pesquisar por usuário:
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <Controller
                name="selectedQuery"
                control={control}
                render={({ field }) => (
                  <Select displayEmpty {...field}>
                    <MenuItem value="" disabled>
                      Pesquisar por...
                    </MenuItem>
                    <MenuItem value="fullName">Nome</MenuItem>
                    <MenuItem value="email">E-mail</MenuItem>
                    <MenuItem value="cpf">CPF</MenuItem>
                    <MenuItem value="consorcio">Associação</MenuItem>
                  </Select>
                )}
              />
            </div>

            <div>
              <Controller
                name="query"
                control={control}
                render={({ field }) => (
                  <TextField
                    color="black"
                    className="w-[100%]"
                    placeholder="Pesquisar"
                    {...field}
                  />
                )}
              />
            </div>

            <Button
              variant="contained"
              color="secondary"
              className="w-full mt-16 z-10"
              aria-label="Pesquisar"
              type="submit"
              size="large"
            >
              Pesquisar
            </Button>
          </form>
        </Box>
      </Modal>
    </div>
  );
}

export default AgentesHome;
