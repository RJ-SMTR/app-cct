import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { selectUser } from 'app/store/userSlice';
import { useSelector } from 'react-redux';

function ForbiddenApp() {
  const user = useSelector(selectUser);
  return (
      <div className="flex flex-col flex-1 items-center justify-center p-16">
      <div className="w-full max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
        >
          <Box
            component="svg"
            width="100%"
            height="100%"
            viewBox="0 0 1075 585"
            fill="none"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
            sx={{ color: 'secondary.main' }}
          >
            <FuseSvgIcon className="text-48" size={64} color="action">material-solid:lock</FuseSvgIcon>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        >
          <Typography
            variant="h1"
            className="mt-48 sm:mt-96 text-4xl md:text-7xl font-extrabold tracking-tight leading-tight md:leading-none text-center"
          >
            Ooops... 404!
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        >
          <Typography
            variant="h5"
            color="text.secondary"
            className="mt-8 text-lg md:text-xl font-medium tracking-tight text-center"
          >
            Parece que você não tem autorização para acessar essa página
          </Typography>
        </motion.div>
        {user.role.name == "Admin" ?
          <Link className="block font-normal mt-48" to="/admin">
            Voltar para página inicial
          </Link> :
          <Link className="block font-normal mt-48" to="/">
            Voltar para página inicial
          </Link>}
      </div>
    </div>
  )
}

export default ForbiddenApp