import React, { useEffect, useMemo, useRef, useState } from 'react'
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import { useDispatch, useSelector } from 'react-redux';
import { Badge } from '@mui/material';
import { Link } from 'react-router-dom';
import { getUser, searchUsers } from 'app/store/adminSlice';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { showMessage } from 'app/store/fuse/messageSlice';

const INVITE_STATUS_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'queued', label: 'Não enviado' },
    { value: 'sent', label: 'Enviado' },
    { value: 'used', label: 'Acessado' },
];

const ROWS_PER_PAGE_OPTIONS = [10, 50, 100, 250, 500, 1000];

function getInviteStatusLabel(user) {
    const inviteStatusName = user?.inviteStatus?.name || user?.aux_inviteStatus?.name;

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
            return null;
    }
}

export function TableUsers() {
    const userList = useSelector((state) => state.admin.userList)
    const dispatch = useDispatch()
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(50)
    const [filtered, setFiltered] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [quickFilter, setQuickFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [inviteStatus, setInviteStatus] = useState('')

    const isFirstRender = useRef(true);

    // Busca combinada por nome, e-mail ou código de permissão (backend faz OR
    // entre os três via `anyField`, ver adminSlice.searchUsers). Dispara ao
    // digitar, com debounce, sem precisar de um botão "Pesquisar".
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return undefined;
        }

        const trimmedQuery = searchQuery.trim();

        if (!trimmedQuery && !inviteStatus) {
            dispatch(getUser());
            setFiltered(false);
            setPage(0);
            return undefined;
        }

        setIsSearching(true);

        const timeoutId = setTimeout(() => {
            dispatch(searchUsers(trimmedQuery, inviteStatus || undefined))
                .then(() => {
                    setFiltered(true);
                    setPage(0);
                })
                .catch((error) => {
                    if (error?.response?.data?.status === 401) {
                        dispatch(showMessage({ message: 'Erro de autenticação. Faça login novamente' }))
                    } else {
                        dispatch(showMessage({ message: 'Houve um erro desconhecido, tente novamente mais tarde.' }));
                    }
                })
                .finally(() => setIsSearching(false));
        }, 400);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, inviteStatus]);

    const handleSearchQueryChange = (event) => {
        setSearchQuery(event.target.value);
    }

    const handleInviteStatusChange = (event) => {
        setInviteStatus(event.target.value);
    }

    const handleClear = () => {
        setSearchQuery('');
        setInviteStatus('');
        setQuickFilter('');
    }

    // Busca rápida: filtra instantaneamente os usuários já carregados, sem nova
    // requisição — complementa a busca "Pesquisar" (que consulta o backend).
    const visibleUsers = useMemo(() => {
        const normalizedQuickFilter = quickFilter.trim().toLowerCase();
        if (!normalizedQuickFilter) return userList;

        return userList.filter((user) =>
            user.fullName?.toLowerCase().includes(normalizedQuickFilter) ||
            user.email?.toLowerCase().includes(normalizedQuickFilter) ||
            user.permitCode?.toLowerCase().includes(normalizedQuickFilter)
        );
    }, [userList, quickFilter]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value)
        setPage(0)
    }

    const handleQuickFilterChange = (event) => {
        setQuickFilter(event.target.value);
        setPage(0);
    }

    const paginatedUsers = visibleUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box className="flex flex-col gap-16 mt-24">
            <Paper className="p-24 rounded-2xl">
                <Typography className="font-semibold text-lg mb-16">Filtros de Pesquisa</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={7} md={5}>
                        <TextField
                            fullWidth
                            label="Nome, e-mail ou código de permissão"
                            placeholder="Digite para pesquisar..."
                            value={searchQuery}
                            onChange={handleSearchQueryChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: isSearching ? (
                                    <InputAdornment position="end">
                                        <CircularProgress size={16} />
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={5} md={3}>
                        <TextField
                            select
                            fullWidth
                            label="Status de convite"
                            value={inviteStatus}
                            onChange={handleInviteStatusChange}
                        >
                            {INVITE_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value || 'todos'} value={option.value}>
                                    {option.label}
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-10 px-4">
                    <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                        Usuários{filtered ? ' (filtrados)' : ''}
                    </Typography>
                    <TextField
                        size="small"
                        placeholder="Busca rápida na página..."
                        value={quickFilter}
                        onChange={handleQuickFilterChange}
                        className="w-full sm:w-[20rem]"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </div>
                <TablePagination
                    component="div"
                    count={visibleUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Linhas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                />
                <div style={{ height: '65vh', overflow: 'auto', marginTop: '12px' }}>
                    <Table className="simple w-full min-w-full" stickyHeader >
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Typography
                                        color="text.secondary"
                                        className="font-semibold text-12 whitespace-nowrap"
                                    >
                                        Código de permissão
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
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedUsers.length > 0 ? paginatedUsers.map((user) => {
                                const statusLabel = getInviteStatusLabel(user);

                                return (
                                    <TableRow key={user.id} hover>
                                        <TableCell component="th" scope="row">
                                            <Typography color="text.secondary">
                                                {user.permitCode}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                {user.fullName ?? 'Fulano'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Typography className="whitespace-nowrap">
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Badge
                                                className="top-[5px] mt-10"
                                                color={statusLabel ? 'success' : 'warning'}
                                                badgeContent={statusLabel ?? 'Convite não enviado'}
                                            />
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            <Link
                                                to={`/admin/user/${user.id}`}
                                                className="rounded p-3 uppercase text-white bg-[#0DB1E3] h-[27px] min-h-[27px] font-medium px-10"
                                            >
                                                Detalhes
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography variant="body2" color="text.secondary" className="py-24">
                                            Não obtivemos resultados para esta consulta
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <TablePagination
                    component="div"
                    count={visibleUsers.length}
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
    );
}
