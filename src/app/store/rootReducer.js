import { combineReducers } from '@reduxjs/toolkit';
import fuse from './fuse';
import i18n from './i18nSlice';
import user from './userSlice';
import steps from './formStepSlice'
import extract from './extractSlice'
import admin from './adminSlice'
import release from './releaseSlice'
import report from './reportSlice'
import vanzeiro from './reportVanzeiroSlice'


const createReducer = (asyncReducers) => (state, action) => {
  const combinedReducer = combineReducers({
    fuse,
    i18n,
    steps,
    user,
    extract,
    admin,
    release,
    report,
    vanzeiro,
    ...asyncReducers,
  });

  /*
	Reset the redux store when user logged out
	 */
  if (action.type === 'user/userLoggedOut') {
    // state = undefined;
  }

  return combinedReducer(state, action);
};

export default createReducer;
