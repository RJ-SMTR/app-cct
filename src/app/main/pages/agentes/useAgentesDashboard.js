import { useCallback, useEffect, useState } from "react";
import { getAgentesDashboard } from "./services/agentesService";

const ERROR_MESSAGE = "Não foi possível carregar o painel de guardador.";

export default function useAgentesDashboard({ id, month, enabled, onError }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setDashboard(null);
    setLoading(true);
    setError("");
    getAgentesDashboard(id, month)
      .then((response) => {
        if (active) setDashboard(response);
      })
      .catch(() => {
        if (!active) return;
        setError(ERROR_MESSAGE);
        onError(ERROR_MESSAGE);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, month, enabled, onError, revision]);

  return { dashboard, loading, error, reload };
}
