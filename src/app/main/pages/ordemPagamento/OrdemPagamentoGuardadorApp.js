import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import jwtServiceConfig from 'src/app/auth/services/jwtService/jwtServiceConfig';
import OrdemPagamentoListPage from './shared/OrdemPagamentoListPage';
import formatDateOnly from './shared/formatDateOnly';

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns = [
  { field: 'id', headerName: 'Id Ordem', width: 140 },
  {
    field: 'dataOrdem',
    headerName: 'Data Ordem',
    width: 140,
    valueFormatter: (params) => formatDateOnly(params.value),
  },
  { field: 'cpfCnpj', headerName: 'CPF', width: 160 },
  { field: 'fullName', headerName: 'Nome', flex: 1, minWidth: 260 },
  {
    field: 'valor',
    headerName: 'Valor',
    width: 160,
    valueFormatter: (params) => formatter.format(params.value ?? 0),
  },
];

const textFilters = [
  { name: 'cpfCnpj', label: 'CPF' },
  { name: 'nome', label: 'Nome' },
];

export default function OrdemPagamentoGuardadorApp() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const token = window.localStorage.getItem('jwt_access_token');
    const formData = new FormData();
    formData.append('file', file);

    setIsImporting(true);
    api
      .post(`${jwtServiceConfig.odpGuardadorLista}/import`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => {
        setImportResult(response.data);
        setRefreshToken((prev) => prev + 1);
      })
      .catch((error) => {
        dispatch(
          showMessage({
            message: error?.response?.data?.error || 'Erro ao importar a planilha.',
          }),
        );
      })
      .finally(() => setIsImporting(false));
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileSelected}
      />

      <OrdemPagamentoListPage
        title="Ordens de Pagamento - Guardador"
        endpoint={jwtServiceConfig.odpGuardadorLista}
        columns={columns}
        getRowId={(row) => row.id}
        textFilters={textFilters}
        refreshToken={refreshToken}
        headerActions={
          <Button
            variant="outlined"
            startIcon={isImporting ? <CircularProgress size={16} /> : <UploadFileIcon />}
            disabled={isImporting}
            onClick={handleImportClick}
          >
            {isImporting ? 'Importando...' : 'Importar Planilha'}
          </Button>
        }
      />

      <Dialog open={Boolean(importResult)} onClose={() => setImportResult(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Resultado da importação</DialogTitle>
        <DialogContent>
          {importResult?.dataOrdemUtilizada && (
            <Typography className="mb-8">
              Data da ordem aplicada: <strong>{format(new Date(importResult.dataOrdemUtilizada), 'dd/MM/yyyy')}</strong>
            </Typography>
          )}
          <Typography className="mb-8">
            Linhas processadas: {importResult?.totalRows ?? 0} — Importadas: {importResult?.imported ?? 0} —
            Não importadas: {importResult?.skipped ?? 0}
          </Typography>
          {importResult?.errors?.length > 0 && (
            <>
              <Typography className="font-semibold mt-16 mb-8">Ocorrências:</Typography>
              <List dense>
                {importResult.errors.map((err, index) => (
                  <ListItem key={`${err.sheet}-${err.row}-${index}`} disableGutters>
                    <ListItemText
                      primary={`Aba "${err.sheet}", linha ${err.row}: ${err.documento}`}
                      secondary={err.motivo}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <Box className="flex justify-end gap-8 p-16">
          <Button onClick={() => setImportResult(null)}>Fechar</Button>
        </Box>
      </Dialog>
    </>
  );
}
