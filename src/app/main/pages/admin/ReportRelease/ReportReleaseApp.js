import { Box, Paper, Card, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import DataGridInfos from './components/DataGrid';
import { useDispatch } from "react-redux";



function ReportReleaseApp() {
  return (
    <>
      <div className="p-24 pt-10">
        <Typography className='font-medium text-3xl'>Relatório Lançamentos</Typography>
        <Box>
        <DataGridInfos />
        </Box>
      </div>
    </>
  )
}

export default ReportReleaseApp