function normalizeToken(token) {
  if (typeof token !== 'string') {
    return null;
  }

  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return null;
  }

  return trimmedToken;
}

function pushToken(tokens, token) {
  const normalizedToken = normalizeToken(token);

  if (!normalizedToken) {
    return;
  }

  tokens.push(normalizedToken);
  tokens.push(normalizedToken.toLowerCase());
}

function pushTokenCollection(tokens, value) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === 'string') {
        pushToken(tokens, item);
        return;
      }

      if (item && typeof item === 'object') {
        pushToken(tokens, item.name);
        pushToken(tokens, item.code);
        pushToken(tokens, item.slug);
      }
    });
    return;
  }

  pushToken(tokens, value);
}

export function getPrimaryUserRole(user) {
  return normalizeToken(user?.role?.name) || normalizeToken(user?.profile) || '';
}

export function getUserAccessTokens(user) {
  const tokens = [];

  pushToken(tokens, user?.role?.name);
  pushToken(tokens, user?.profile);
  pushTokenCollection(tokens, user?.profiles);
  pushTokenCollection(tokens, user?.permissions);
  pushTokenCollection(tokens, user?.permission);

  return [...new Set(tokens)];
}

export function hasAgentesAccess(user) {
  const accessTokens = getUserAccessTokens(user);

  return ['agentes', 'admin', 'admin master'].some((token) => accessTokens.includes(token));
}

export function isAgenteUser(user) {
  const accessTokens = getUserAccessTokens(user);

  return accessTokens.includes('agentes');
}

export function isAdminUser(user) {
  const accessTokens = getUserAccessTokens(user);

  return ['admin', 'admin master'].some((token) => accessTokens.includes(token));
}
