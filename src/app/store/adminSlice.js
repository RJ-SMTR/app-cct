import { createSlice } from '@reduxjs/toolkit';
import { api } from '../configs/api/api';
import { setStatements } from './extractSlice';
import JwtService from '../auth/services/jwtService';

const initialState = {
  agentsList: [],
  agentsListStatus: 'idle', // 'idle' | 'loaded' — drives the getAgentUsers cache below
  userList: [],
  sendEmailValue: Boolean,
};

function normalizeResponseCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

const stepSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAgentsList: (state, action) => {
      state.agentsList = action.payload;
      state.agentsListStatus = 'loaded';
    },
    invalidateAgentsList: (state) => {
      state.agentsListStatus = 'idle';
    },
    setUsersList: (state, action) => {
      state.userList = action.payload;
    },
    setSendEmailValue: (state, action) => {
      state.sendEmailValue = action.payload;
    },
  },
});

export const {
  setAgentsList,
  invalidateAgentsList,
  setUsersList,
  userList,
  sendEmailValue,
  setSendEmailValue,
} = stepSlice.actions;
export default stepSlice.reducer;

// Every report/filter/admin page that needs the guardador list called this on every mount,
// so navigating between them re-fetched the same data over and over. agentsListStatus caches
// it across the app; agentsListRequest dedupes callers that mount at the same time, before the
// first request has resolved. Call dispatch(invalidateAgentsList()) after a mutation that
// changes what this list should show (e.g. editing a guardador's name/email/invite status).
let agentsListRequest = null;

export const getAgentUsers = () => (dispatch, getState) => {
  const { admin } = getState();

  if (admin.agentsListStatus === 'loaded') {
    return Promise.resolve(admin.agentsList);
  }

  if (agentsListRequest) {
    return agentsListRequest;
  }

  const token = window.localStorage.getItem('jwt_access_token');
  if (!JwtService.isAuthTokenValid(token)) {
    return Promise.resolve([]);
  }

  agentsListRequest = new Promise((resolve, reject) => {
    api.get('/agentes/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        const filteredUsers = normalizeResponseCollection(response.data)
          .sort((firstUser, secondUser) => {
            return (firstUser.fullName || '').localeCompare(secondUser.fullName || '');
          });

        dispatch(setAgentsList(filteredUsers));
        resolve(filteredUsers);
      })
      .catch((error) => {
        reject(error);
      });
  }).finally(() => {
    agentsListRequest = null;
  });

  return agentsListRequest;
};

export const getUser = () => (dispatch) => {
  const token = window.localStorage.getItem('jwt_access_token');
  if (JwtService.isAuthTokenValid(token)) {
    return new Promise((resolve, reject) => {
      api.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          const filteredUsers = response.data.data.filter(
            (user) => user.permitCode != null && user.role?.name !== 'Admin'
          );
          dispatch(setUsersList(filteredUsers));
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  return Promise.resolve(null);
};
export const getInfo = () => (dispatch) => {
  const token = window.localStorage.getItem('jwt_access_token');
  const currentHostname = window.location.hostname;
  const isProduction = currentHostname === 'cct.mobilidade.rio';

  const baseUrl = isProduction
    ? 'https://api.cct.mobilidade.rio/'
    : 'https://api.cct.hmg.mobilidade.rio/';
  return new Promise((resolve, reject) => {
    api.get(`${baseUrl}api/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        const targetObject = response.data.find(
          (item) => item.name === 'activate_auto_send_invite'
        );
        dispatch(setSendEmailValue(targetObject));
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
export const getUserByInfo = (selectedQuery, query, inviteStatus) => (dispatch) => {
  const token = window.localStorage.getItem('jwt_access_token');
  if (JwtService.isAuthTokenValid(token)) {
    const queryKey = selectedQuery === 'fullName' ? 'name' : selectedQuery;
    return new Promise((resolve, reject) => {
      const requestData = {
        [queryKey]: query,
        inviteStatus,
      };

      api.get('/users', {
        params: requestData,
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          const filteredUsers = response.data.data.filter(
            (user) => user.permitCode != null && user.role?.name !== 'Admin'
          );
          dispatch(setUsersList(filteredUsers));
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  return Promise.resolve(null);
};
// function handleUserData(previousDays, dateRange, searchingDay, searchingWeek) {
//     if (dateRange?.length > 0 && !searchingDay) {
//         const separateDate = dateRange.map((i) => {
//             const inputDateString = i;
//             const dateObj = new Date(inputDateString);
//             const year = dateObj.getFullYear();
//             const month = String(dateObj.getMonth() + 1).padStart(2, "0");
//             const day = String(dateObj.getDate()).padStart(2, "0");
//             const formattedDate = `${year}-${month}-${day}`;
//             return formattedDate;
//         });
//         return {
//             startDate: separateDate[0],
//             endDate: separateDate[1]
//         };
//     } else if (searchingDay && searchingWeek) {
//         return {
//             startDate: dateRange[0],
//             endDate: dateRange[1]
//         };
//     } else {
//         return previousDays > 0 ? { previousDays: previousDays } : {}
//     }
// }
export const getUserStatements = (userId) => (dispatch) => {
  const token = window.localStorage.getItem('jwt_access_token');
  if (JwtService.isAuthTokenValid(token)) {
    return new Promise((resolve, reject) => {
      const apiRoute = `bank-statements/me?userId=${userId}`;
      api.get(apiRoute, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          dispatch(setStatements(response.data.data));
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  return Promise.resolve(null);
};
