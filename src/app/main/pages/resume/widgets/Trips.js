import React from 'react'
import { Paper, Skeleton, Typography } from "@mui/material"
import FuseSvgIcon from '@fuse/core/FuseSvgIcon'

function Trips() {
  return (
      <Paper className="relative flex flex-col flex-auto p-12 pr-12  rounded-2xl shadow overflow-hidden">
          <div className="flex items-center justify-between">
              <div className="flex flex-col">
                  <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                    Viagens feitas
                  </Typography>
                  <Typography className="font-medium text-sm">12-07</Typography>

              </div>

          </div>
          <div className="flex flex-row flex-wrap mt-8 ">
              <Typography className="mt-8 font-medium text-3xl leading-none">
                 Count
              </Typography>
          </div>

          <div className="absolute bottom-5 ltr:right-5 rtl:left-0 w-96 h-96 -m-24">
              <FuseSvgIcon size={90} className="opacity-25 text-[#004a80] dark:text-[#004a80">
                  material-solid:directions_bus
              </FuseSvgIcon>

          </div>
      </Paper>
  )
}

export default Trips