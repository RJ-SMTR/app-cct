import { ThemeProvider } from '@mui/material/styles';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { selectFuseCurrentLayoutConfig, selectNavbarTheme } from 'app/store/fuse/settingsSlice';
import { selectFuseNavbar } from 'app/store/fuse/navbarSlice';
import NavbarStyle1 from './navbar/style-1/NavbarStyle1';
import NavbarToggleFab from '../../shared-components/NavbarToggleFab';

function NavbarWrapperLayout1(props) {
  const config = useSelector(selectFuseCurrentLayoutConfig);
  const navbar = useSelector(selectFuseNavbar);

  const navbarTheme = useSelector(selectNavbarTheme);

  return (
    <>
      <ThemeProvider theme={navbarTheme}>
        <>
          {config.navbar.style === 'style-1' && <NavbarStyle1 />}
 
        </>
      </ThemeProvider>

      {config.navbar.display && !config.toolbar.display && !navbar.open && <NavbarToggleFab />}
    </>
  );
}

export default memo(NavbarWrapperLayout1);
