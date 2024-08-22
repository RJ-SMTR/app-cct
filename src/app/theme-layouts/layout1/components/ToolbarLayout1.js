import { ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Hidden from '@mui/material/Hidden';
import Toolbar from '@mui/material/Toolbar';
import clsx from 'clsx';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { selectFuseCurrentLayoutConfig, selectToolbarTheme } from 'app/store/fuse/settingsSlice';
import { selectFuseNavbar } from 'app/store/fuse/navbarSlice';
import NotificationPanelToggleButton from '../../shared-components/notificationPanel/NotificationPanelToggleButton';
import NavbarToggleButton from '../../shared-components/NavbarToggleButton';
import UserMenu from '../../shared-components/UserMenu';
import { Box } from '@mui/material';
import { Link } from 'react-router-dom';


function ToolbarLayout1(props) {
  const config = useSelector(selectFuseCurrentLayoutConfig);
  const navbar = useSelector(selectFuseNavbar);
  const toolbarTheme = useSelector(selectToolbarTheme);

  return (
    <ThemeProvider theme={toolbarTheme}>
      <AppBar
        id="fuse-toolbar"
        className={clsx('flex relative z-20 shadow-md', props.className)}
        color="default"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? toolbarTheme.palette.background.paper
              : toolbarTheme.palette.background.default,
        }}
        position="static"
      >
        <Toolbar className="p-0 min-h-48 md:min-h-64">
          <div className="flex flex-1 justify-center">
            {config.navbar.display && config.navbar.position === 'left' && (
              <>
                <Hidden lgDown>
                  {config.navbar.style === 'style-1' && !navbar.open && (
                    <>
                      <NavbarToggleButton className="w-40 h-40 p-0 mx-0 absolute left-16" />
                      <Box >
                        <Link to='/'>
                          <img className="w-full max-w-64" src="assets/icons/logoPrefeitura.png" alt="footer logo" />
                        </Link>
                      </Box>
                    </>
                
                  )}
                </Hidden>

                 <Hidden lgUp>
                  <NavbarToggleButton className="w-40 h-40 p-0 mx-0 absolute left-16 sm:mx-8 " />
                  <Box >
                    <Link to='/'>
                      <img className="w-full max-w-64" src="assets/icons/logoPrefeitura.png" alt="footer logo" />
                    </Link>
                  </Box>
                </Hidden> 
               
              </>
            )}
     
          </div>

          <div className="flex items-center px-8 h-full overflow-x-auto absolute right-16">

           
            <UserMenu />
          </div>

          {config.navbar.display && config.navbar.position === 'right' && (
            <>
              <Hidden lgDown>
                {!navbar.open && <NavbarToggleButton className="w-40 h-40 p-0 mx-0" />}
              </Hidden>

              <Hidden lgUp>
                <NavbarToggleButton className="w-40 h-40 p-0 mx-0 sm:mx-8" />
              </Hidden>
            </>
          )}
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
}

export default memo(ToolbarLayout1);
