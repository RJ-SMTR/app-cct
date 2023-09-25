import { Paper, Skeleton, Typography } from "@mui/material"
import FuseSvgIcon from "@fuse/core/FuseSvgIcon"
import { useDispatch, useSelector } from 'react-redux';

function Entries() {
    const dateRange = useSelector(state => state.extract.dateRange);
    const statements = useSelector(state => state.extract.statements);
        const date = new Date(`${statements[0]?.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'Etc/UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
  return (
      <>{statements.length  ? <Paper className="relative flex flex-col flex-auto p-12 pr-12  rounded-2xl shadow overflow-hidden">
          <div className="flex items-center justify-between">
              <div className="flex flex-col">
                  <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                      Valor a receber
                  </Typography>
                  <Typography className="font-medium text-sm">{date} - 3 semana</Typography>

              </div>

          </div>
          <div className="flex flex-row flex-wrap mt-8 ">
              <Typography className="mt-8 font-medium text-3xl leading-none">
                  R$ {statements[0]?.receivable}
              </Typography>
          </div>

          <div className="absolute bottom-0 ltr:right-0 rtl:left-0 w-96 h-96 -m-24">
              <FuseSvgIcon size={90} className="opacity-25 text-green-500 dark:text-green-400">
                  heroicons-outline:currency-dollar
              </FuseSvgIcon>

          </div>
      </Paper> : 
          <Paper className="relative flex flex-col flex-auto p-12 pr-12  rounded-2xl shadow overflow-hidden">
            <Skeleton variant="rectangular" width={318} height={50} />
          </Paper>}
                </>
  )
}

export default Entries