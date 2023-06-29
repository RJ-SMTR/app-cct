import { Card } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Link } from 'react-router-dom';



function EmailSentPage() {

    return (
        <div className="flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
            <Paper className="h-full sm:h-auto md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 z-10">
                <div className="w-full max-w-320 sm:w-320 mx-auto sm:mx-0 mt-48">
                    <img src="assets/icons/logo.svg" className='mb-10' alt='logo CCT' />
                    <div className='flex flex-col p-24  items-center'>
                        <Box>
                        <img src='assets/icons/emailSent.svg'/>
                        </Box>
                        <h2 className='text-center mb-10'>
                            Te enviamos uma confirmação no seu e-mail! Para poder acessar seu perfil valide seu acesso.
                        </h2>

                        <Link to='/sign-in'>
                            Ir para o login
                        </Link>
                    </div>
                    <svg
                        className="absolute inset-0 pointer-events-none md:hidden"
                        viewBox="0 0 960 540"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMax slice"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <Box
                            component="g"
                            sx={{ color: 'primary.light' }}
                            className="opacity-20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="100"
                        >
                            <circle r="234" cx="720" cy="491" />
                        </Box>
                    </svg>
                </div>
            </Paper>

            <Box className="relative hidden md:flex flex-auto items-center justify-center h-screen  overflow-hidden ">
                <img src="assets/images/etc/BRT.jpg" className="w-full" alt="BRT" />
        </Box>
        </div >
    );
}

export default EmailSentPage;
