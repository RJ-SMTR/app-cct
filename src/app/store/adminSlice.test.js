jest.mock('../configs/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('./extractSlice', () => ({
  setStatements: jest.fn(),
}));

jest.mock('../auth/services/jwtService', () => ({
  __esModule: true,
  default: {
    isAuthTokenValid: jest.fn(),
  },
}));

import { api } from '../configs/api/api';
import JwtService from '../auth/services/jwtService';
import adminReducer, { getAgentUsers, setAgentsList, invalidateAgentsList } from './adminSlice';

describe('getAgentUsers', () => {
  let storage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = {};
    global.window = {
      localStorage: {
        getItem: jest.fn((key) => storage[key] ?? null),
        setItem: jest.fn((key, value) => {
          storage[key] = value;
        }),
        clear: jest.fn(() => {
          storage = {};
        }),
      },
    };
    window.localStorage.setItem('jwt_access_token', 'valid-token');
    JwtService.isAuthTokenValid.mockReturnValue(true);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  const idleState = { admin: { agentsList: [], agentsListStatus: 'idle' } };
  const loadedState = (agentsList) => ({ admin: { agentsList, agentsListStatus: 'loaded' } });

  it('keeps users without permitCode in the agentes list while sorting by fullName', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 2,
          fullName: 'Zuleica Souza',
          permitCode: null,
        },
        {
          id: 1,
          fullName: 'Ana Clara',
          permitCode: '12345',
        },
      ],
    });

    const dispatch = jest.fn();
    const getState = jest.fn(() => idleState);

    const result = await getAgentUsers()(dispatch, getState);

    expect(result).toEqual([
      {
        id: 1,
        fullName: 'Ana Clara',
        permitCode: '12345',
      },
      {
        id: 2,
        fullName: 'Zuleica Souza',
        permitCode: null,
      },
    ]);
    expect(dispatch).toHaveBeenCalledWith(
      setAgentsList([
        {
          id: 1,
          fullName: 'Ana Clara',
          permitCode: '12345',
        },
        {
          id: 2,
          fullName: 'Zuleica Souza',
          permitCode: null,
        },
      ])
    );
  });

  it('does not call the API again once the list is already loaded', async () => {
    const cachedList = [{ id: 1, fullName: 'Ana Clara', permitCode: '12345' }];
    const dispatch = jest.fn();
    const getState = jest.fn(() => loadedState(cachedList));

    const result = await getAgentUsers()(dispatch, getState);

    expect(api.get).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(result).toBe(cachedList);
  });

  it('fetches again after invalidateAgentsList is dispatched', async () => {
    api.get.mockResolvedValue({
      data: [{ id: 1, fullName: 'Ana Clara', permitCode: '12345' }],
    });
    const dispatch = jest.fn();
    const getState = jest.fn(() => idleState);

    await getAgentUsers()(dispatch, getState);

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('shares a single in-flight request between concurrent callers', async () => {
    let resolveRequest;
    api.get.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const dispatch = jest.fn();
    const getState = jest.fn(() => idleState);

    const firstCall = getAgentUsers()(dispatch, getState);
    const secondCall = getAgentUsers()(dispatch, getState);

    resolveRequest({ data: [{ id: 1, fullName: 'Ana Clara', permitCode: '12345' }] });
    const [firstResult, secondResult] = await Promise.all([firstCall, secondCall]);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
  });
});

describe('invalidateAgentsList', () => {
  it('resets the cache status to idle but keeps the stale list until it refetches', () => {
    const previousState = {
      agentsList: [{ id: 1, fullName: 'Ana Clara' }],
      agentsListStatus: 'loaded',
      userList: [],
      sendEmailValue: Boolean,
    };

    const nextState = adminReducer(previousState, invalidateAgentsList());

    expect(nextState.agentsListStatus).toBe('idle');
    expect(nextState.agentsList).toEqual([{ id: 1, fullName: 'Ana Clara' }]);
  });
});
