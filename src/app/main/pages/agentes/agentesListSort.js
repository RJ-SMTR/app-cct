const NOME_PADRAO = 'guardador';

/** Sem nome de verdade: vazio ou o rótulo genérico "Guardador" que a tela usa quando o cadastro não tem nome. */
export function semNome(fullName) {
  const nome = String(fullName ?? '').trim().toLowerCase();
  return nome === '' || nome === NOME_PADRAO;
}

/**
 * Ordena os guardadores por nome (A-Z, sem diferenciar acento nem maiúscula) e deixa no final os sem nome
 * (em branco ou "Guardador"), mantendo a ordem original entre eles. Não altera a lista recebida.
 */
export function sortAgentsByName(agentUsers) {
  const lista = Array.isArray(agentUsers) ? agentUsers : [];
  const comNome = lista.filter((agentUser) => !semNome(agentUser?.fullName));
  const semNomeLista = lista.filter((agentUser) => semNome(agentUser?.fullName));

  comNome.sort((a, b) =>
    String(a.fullName).trim().localeCompare(String(b.fullName).trim(), 'pt-BR', { sensitivity: 'base' })
  );

  return [...comNome, ...semNomeLista];
}
