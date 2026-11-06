import { useEffect, useState } from "react";
import { getAgentePagamentoIndevido } from "./services/agentesService";

/**
 * Indevido do guardador (tabela pagamento_indevido), buscado uma vez e usado pelo quadro do indevido e pela visão mensal (status
 * "Abatimento por duplicidade"). Se a consulta falhar, devolve null e a tela segue como era.
 */
export default function useAgentePagamentoIndevido({ agentId, enabled = true }) {
  const [indevido, setIndevido] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIndevido(null);

    if (!enabled || !agentId) {
      return undefined;
    }

    getAgentePagamentoIndevido(agentId)
      .then((result) => {
        if (!cancelled) {
          setIndevido(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIndevido(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [agentId, enabled]);

  return indevido;
}
