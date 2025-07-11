import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import LockIcon from '@mui/icons-material/Lock';

function Error404Page() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-16">
      <div className="w-full max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
        >
          <img width="300" className="mx-auto" src="assets/icons/logoPrefeitura.png" alt="logo" />
        </motion.div>

        <Box className="mt-32 flex justify-center">
          <LockIcon className="text-[120px]" />
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        >
          <Typography
            variant="h1"
            className="mt-20 sm:mt-24 text-4xl md:text-7xl font-extrabold tracking-tight leading-tight md:leading-none text-center"
          >
            Acesso Negado
          </Typography>
        </motion.div>

        <Box className="mt-12 text-xl text-center">
          Por favor, contacte o&nbsp;
          <Link className="underline text-blue-600" to="https://transportes.prefeitura.rio/atendimentodigital/">
            suporte
          </Link>
          &nbsp;ou acesse o sistema através deste&nbsp;
          <Link className="underline text-blue-600" to="https://cct.mobilidade.rio/sign-in">
            link
          </Link>
        </Box>
      </div>
    </div>
  );
}

export default Error404Page;
