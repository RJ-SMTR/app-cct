import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import navigationConfig from 'app/configs/navigationConfig';
import navAdminConfig from 'app/configs/navAdminConfig';
import FuseUtils from '@fuse/utils';
import i18next from 'i18next';
import _ from '@lodash';
import navFinanConfig from 'app/configs/navFinanConfig';
import masterConfig from 'app/configs/masterConfig';

const navigationAdapter = createEntityAdapter();
const emptyInitialState = navigationAdapter.getInitialState();
const initialState = navigationAdapter.upsertMany(emptyInitialState, navigationConfig);

export const appendNavigationItem = (item, parentId) => (dispatch, getState) => {
  const navigation = selectNavigationAll(getState());

  return dispatch(setNavigation(FuseUtils.appendNavItem(navigation, item, parentId)));
};

export const prependNavigationItem = (item, parentId) => (dispatch, getState) => {
  const navigation = selectNavigationAll(getState());

  return dispatch(setNavigation(FuseUtils.prependNavItem(navigation, item, parentId)));
};

export const updateNavigationItem = (id, item) => (dispatch, getState) => {
  const navigation = selectNavigationAll(getState());

  return dispatch(setNavigation(FuseUtils.updateNavItem(navigation, id, item)));
};

export const removeNavigationItem = (id) => (dispatch, getState) => {
  const navigation = selectNavigationAll(getState());

  return dispatch(setNavigation(FuseUtils.removeNavItem(navigation, id)));
};

export const {
  selectAll: selectNavigationAll,
  selectIds: selectNavigationIds,
  selectById: selectNavigationItemById,
} = navigationAdapter.getSelectors((state) => state.fuse.navigation);

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setNavigation: navigationAdapter.setAll,
    resetNavigation: (state, action) => initialState,
  },
});

export const { setNavigation, resetNavigation } = navigationSlice.actions;

const getUserRole = (state) => state.user.role?.name;


export const selectNavigation = createSelector(
  [selectNavigationAll, ({ i18n }) => i18n.language, getUserRole],
  (navigation, language, userRole) => {
    function setTranslationValues(data) {
      // loop through every object in the array
      return data.map((item) => {
        if (item.translate && item.title) {
          item.title = i18next.t(`navigation:${item.translate}`);
        }

        // see if there is a children node
        if (item.children) {
          // run this function recursively on the children array
          item.children = setTranslationValues(item.children);
        }
        return item;
      });
    }
    let configToUse;
    switch (userRole) {
      
      case 'Admin Master':
        configToUse = masterConfig;
        break;
      case 'Admin':
        configToUse = navAdminConfig;
        break;
      case 'Lançador Financeiro':
      case 'Aprovador Financeiro':
      case 'Admin Finan':
        configToUse = navFinanConfig;
        break;
      default:
        configToUse = navigationConfig;
    }
    


    return setTranslationValues(
      _.merge(
        [],
        filterRecursively(configToUse, (item) => FuseUtils.hasPermission(item.auth, userRole))
      )
    );
  }
);

function filterRecursively(arr, predicate) {
  return arr.filter(predicate).map((item) => {
    item = { ...item };
    if (item.children) {
      item.children = filterRecursively(item.children, predicate);
    }
    return item;
  });
}

export const selectFlatNavigation = createSelector([selectNavigation], (navigation) =>
  FuseUtils.getFlatNavigation(navigation)
);

export default navigationSlice.reducer;
