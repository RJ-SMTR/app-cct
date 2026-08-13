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
import { getAgentUsers, setAgentsList } from './adminSlice';

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

    const result = await getAgentUsers()(dispatch);

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
});
