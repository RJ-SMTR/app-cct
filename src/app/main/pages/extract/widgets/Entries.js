import { Paper, Typography } from "@mui/material"
import FuseSvgIcon from "@fuse/core/FuseSvgIcon"

function Entries() {
  return (
      <Paper className="relative flex flex-col flex-auto p-12 pr-12  rounded-2xl shadow overflow-hidden">
          <div className="flex items-center justify-between">
              <div className="flex flex-col">
                  <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                      Valores a receber
                  </Typography>
                  <Typography className="text-green-600 font-medium text-sm">1 a 6 de agosto</Typography>

              </div>

          </div>
          <div className="flex flex-row flex-wrap mt-8 ">
              <Typography className="mt-8 font-medium text-3xl leading-none">
                  R$ 9.450,00
              </Typography>
          </div>

          <div className="absolute bottom-0 ltr:right-0 rtl:left-0 w-96 h-96 -m-24">
              <FuseSvgIcon size={90} className="opacity-25 text-green-500 dark:text-green-400">
                  heroicons-outline:currency-dollar
              </FuseSvgIcon>

          </div>
      </Paper>
  )
}

export default Entries