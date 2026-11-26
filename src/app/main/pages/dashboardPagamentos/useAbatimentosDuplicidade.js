import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { api } from 'app/configs/api/api';
import { showMessage } from 'app/store/fuse/messageSlice';

/** Pagamentos com abatimento por duplicidade (guardadores) com vencimento no período `{ dataInicio, dataFim }`. */
export default function useAbatimentosDuplicidade(periodo) {
  const dispatch = useDispatch();
  const [itens, setItens] = useState([]);
  const dataInicio = periodo?.dataInicio;
  const dataFim = periodo?.dataFim;

  useEffect(() => {
    let ativo = true;
    setItens([]);
    if (!dataInicio || !dataFim) return undefined;
    const token = window.localStorage.getItem('jwt_access_token');
    api
      .get('pagamentos-indevidos/guardadores/abatimentos', {
        headers: { Authorization: `Bearer ${token}` },
        params: { dataInicio, dataFim },
      })
      .then((response) => ativo && setItens(response.data?.itens ?? []))
      .catch((error) => {
        if (ativo) dispatch(showMessage({ message: error?.response?.data?.error || 'Não foi possível carregar o abatimento por duplicidade.' }));
      });
    return () => {
      ativo = false;
    };
  }, [dataInicio, dataFim, dispatch]);

  return itens;
}
