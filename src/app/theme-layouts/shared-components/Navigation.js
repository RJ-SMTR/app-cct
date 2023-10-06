import FuseNavigation from '@fuse/core/FuseNavigation';
import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNavigation } from 'app/store/fuse/navigationSlice';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { navbarCloseMobile } from 'app/store/fuse/navbarSlice';
import { selectUser } from 'app/store/userSlice';

function Navigation(props) {
  const navigation = useSelector(selectNavigation);
  const user = useSelector(selectUser)
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

  const dispatch = useDispatch();

  return useMemo(() => {
    function handleItemClick(item) {
      if (isMobile) {
        dispatch(navbarCloseMobile());
      }
    }

    return (
 <div>
     
        {user.role.name == 'Admin' ? <FuseNavigation
          className={clsx('navigation', props.className)}
          navigation={navigation}
          layout={props.layout}
          dense={props.dense}
          active={props.active}
          onItemClick={handleItemClick}
        /> : <>
            <FuseNavigation
              className={clsx('navigation', props.className)}
              navigation={navigation}
              layout={props.layout}
              dense={props.dense}
              active={props.active}
              onItemClick={handleItemClick}
              />
              </>}
      
 </div>
    );
  }, [dispatch, isMobile, navigation, props.active, props.className, props.dense, props.layout]);
}

Navigation.defaultProps = {
  layout: 'vertical',
};

export default memo(Navigation);
