import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { selectUser } from 'app/store/userSlice';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';
import JwtService from 'src/app/auth/services/jwtService';
import { isAdminUser, isAgenteUser } from 'src/app/auth/utils/accessUtils';

function AgentesHome() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminUser(user)) {
      setLoading(false);
      return;
    }

    const token = window.localStorage.getItem('jwt_access_token');

    if (!JwtService.isAuthTokenValid(token)) {
      setLoading(false);
      return;
    }

    setLoading(true);

    api
      .get('/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const agentUsers = response.data.data
          .filter((agentUser) => agentUser.permitCode != null && isAgenteUser(agentUser))
          .sort((firstUser, secondUser) => {
            return (firstUser.fullName || '').localeCompare(secondUser.fullName || '');
          });

        setAgents(agentUsers);
      })
      .catch(() => {
        dispatch(
          showMessage({
            message: 'Não foi possível carregar os agentes.',
          })
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch, user]);

  let agentRows = (
    <TableRow>
      <TableCell colSpan={4}>Não há agentes para exibir.</TableCell>
    </TableRow>
  );

  if (loading) {
    agentRows = (
      <TableRow>
        <TableCell colSpan={4}>Carregando agentes...</TableCell>
      </TableRow>
    );
  } else if (agents.length > 0) {
    agentRows = agents.map((agentUser) => (
      <TableRow key={agentUser.id}>
        <TableCell>
          <Typography color="text.secondary">{agentUser.permitCode}</Typography>
        </TableCell>
        <TableCell>
          <Typography className="whitespace-nowrap">{agentUser.fullName ?? 'Agente'}</Typography>
        </TableCell>
        <TableCell>
          <Typography className="whitespace-nowrap">{agentUser.email}</Typography>
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

  return (
    <div className="p-24 pt-10">
      <Typography className="font-medium text-3xl">Agentes</Typography>
      <Box className="flex flex-col justify-around">
        <Paper className="flex flex-col flex-auto p-12 mt-24 shadow rounded-2xl overflow-hidden">
          <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
            <Table className="simple w-full min-w-full" stickyHeader>
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
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>{agentRows}</TableBody>
            </Table>
          </div>
        </Paper>
      </Box>
      <br />
    </div>
  );
}

export default AgentesHome;
