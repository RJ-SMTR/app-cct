import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Button,
  Badge,
  Chip,
  Grid,
  InputAdornment,
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
import SearchIcon from '@mui/icons-material/Search';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { format } from 'date-fns';
import { utils, writeFile as writeFileXLSX } from 'xlsx';
import { Link, Navigate } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';
import { showMessage } from 'app/store/fuse/messageSlice';
import { getAgentUsers } from 'app/store/adminSlice';
import { isAdminUser } from 'src/app/auth/utils/accessUtils';

const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 250, 500, 1000];

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
    case 'prov':
      return 'Provisionado';
    default:
      return '';
  }
}

// Lista, sem duplicatas, das associações presentes na base já carregada — usada
// para popular o filtro "Associação".
function buildAssociationOptions(agentUsers) {
  const uniqueAssociations = new Set();

  agentUsers.forEach((agentUser) => {
    if (Array.isArray(agentUser?.associacoes) && agentUser.associacoes.length > 0) {
      agentUser.associacoes.forEach((association) => {
        const label = getAssociationLabel(association);
        if (label) uniqueAssociations.add(label);
      });
    } else {
      const label = getAgentAssociation(agentUser);
      if (label && label !== '-') uniqueAssociations.add(label);
    }
  });

  return Array.from(uniqueAssociations).sort((first, second) => first.localeCompare(second));
}

function agentMatchesAssociation(agentUser, association) {
  if (!association) return true;

  if (Array.isArray(agentUser?.associacoes) && agentUser.associacoes.length > 0) {
    return agentUser.associacoes.some(
      (item) => getAssociationLabel(item) === association
    );
  }

  return getAgentAssociation(agentUser) === association;
}

function AgentesHome() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const fetchedAgents = useSelector((state) => state.admin?.agentsList);
  const [allAgents, setAllAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssociation, setSelectedAssociation] = useState('');

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
        setAllAgents(normalizeAgentList(agentUsers));
      })
      .catch(() => {
        setAllAgents([]);
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
    setAllAgents(normalizeAgentList(fetchedAgents));
  }, [fetchedAgents]);

  const associationOptions = useMemo(() => buildAssociationOptions(allAgents), [allAgents]);

  // Busca combinada por nome, e-mail ou CPF — filtra instantaneamente a lista já
  // carregada (não há paginação real no backend para guardadores).
  const agents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return allAgents.filter((agentUser) => {
      if (!agentMatchesAssociation(agentUser, selectedAssociation)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [agentUser?.fullName, agentUser?.email, getAgentCpf(agentUser)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [allAgents, searchQuery, selectedAssociation]);

  const filtered = Boolean(searchQuery.trim()) || Boolean(selectedAssociation);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedAssociation]);

  const handleSearchQueryChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleAssociationChange = (event) => {
    setSelectedAssociation(event.target.value);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedAssociation('');
  };

  // Exporta CPF, Nome, E-mail e Associação dos guardadores atualmente
  // filtrados (respeita a busca e o filtro de associação da tela).
  const handleExportXlsx = () => {
    const sheetData = agents.map((agentUser) => ({
      CPF: getAgentCpf(agentUser),
      Nome: agentUser.fullName ?? 'Guardador',
      'E-mail': agentUser.email ?? '',
      Associação: getAgentAssociation(agentUser),
    }));

    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(sheetData);
    utils.book_append_sheet(workbook, worksheet, 'Guardadores');
    writeFileXLSX(workbook, `guardadores_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
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
      <Box className="flex flex-col gap-16 mt-24">
        <Paper className="p-24 rounded-2xl">
          <Typography className="font-semibold text-lg mb-16">Filtros de Pesquisa</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={7} md={5}>
              <TextField
                fullWidth
                label="Nome, e-mail ou CPF"
                placeholder="Digite para pesquisar..."
                value={searchQuery}
                onChange={handleSearchQueryChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={5} md={3}>
              <TextField
                select
                fullWidth
                label="Associação"
                value={selectedAssociation}
                onChange={handleAssociationChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {associationOptions.map((association) => (
                  <MenuItem key={association} value={association}>
                    {association}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {filtered && (
              <Grid item xs={12} sm="auto">
                <Button variant="outlined" type="button" onClick={handleClear}>
                  Remover filtros
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper className="flex flex-col flex-auto p-12 shadow rounded-2xl overflow-hidden">
          <div className="flex flex-row justify-between items-center px-4">
            <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
              Usuários{filtered ? ' (filtrados)' : ''}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveAltIcon />}
              disabled={agents.length === 0}
              onClick={handleExportXlsx}
            >
              Exportar
            </Button>
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
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
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
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          />
        </Paper>
      </Box>
    </div>
  );
}

export default AgentesHome;
