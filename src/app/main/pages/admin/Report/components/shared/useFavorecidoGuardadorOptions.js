import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUser, getAgentUsers } from "app/store/adminSlice";
import { showMessage } from "app/store/fuse/messageSlice";
import { buildAgentAutocompleteOptions, buildAssociationAutocompleteOptions } from "app/store/agentConsolidatedReportUtils";

/**
 * Carrega as opções de filtro de favorecido (permissionário) ou guardador/associação (guardador).
 * Esse par de efeitos era duplicado (quase idêntico) entre ConsolidatedReportPage.js e
 * FinancialMovementReport.js; a única variação real entre os dois era o texto da mensagem de erro.
 */
export default function useFavorecidoGuardadorOptions(isGuardador, { loadErrorMessage } = {}) {
  const dispatch = useDispatch();
  const userList = useSelector((state) => state.admin.userList) || [];

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [agentOptions, setAgentOptions] = useState([]);
  const [associationOptions, setAssociationOptions] = useState([]);

  useEffect(() => {
    if (isGuardador) {
      setLoadingUsers(true);
      dispatch(getAgentUsers())
        .then((agentUsers) => {
          const normalized = Array.isArray(agentUsers) ? agentUsers : [];
          setAgentOptions(buildAgentAutocompleteOptions(normalized));
          setAssociationOptions(buildAssociationAutocompleteOptions(normalized));
        })
        .catch(() => {
          setAgentOptions([]);
          setAssociationOptions([]);
          dispatch(showMessage({ message: loadErrorMessage || "Não foi possível carregar os guardadores e associações." }));
        })
        .finally(() => setLoadingUsers(false));
    } else {
      setLoadingUsers(true);
      dispatch(getUser());
      setLoadingUsers(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuardador]);

  useEffect(() => {
    if (isGuardador) return;
    if (userList && userList.length > 0) {
      const options = userList.map((user) => ({
        label: user.label,
        value: { cpfCnpj: user.cpfCnpj, permitCode: user.permitCode, fullName: user.fullName, userId: user.id },
      }));
      const sortedOptions = options.sort((a, b) => a.value.fullName.localeCompare(b.value.fullName));
      setUserOptions([{ label: "Todos", value: { fullName: "Todos" } }, ...sortedOptions]);
    } else {
      setUserOptions([]);
    }
  }, [userList, isGuardador]);

  return { loadingUsers, userOptions, agentOptions, associationOptions };
}
