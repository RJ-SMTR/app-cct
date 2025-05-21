import {
    Box,
    Paper,
    Card,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import DataGridStatements from "../Approval/components/DataGridStatements"
import DataGridStatementsCB from "../Approval/components/DataGridStatementsCB"
import { useDispatch, useSelector } from "react-redux";
import CardBalance from "../Approval/components/CardBalance";
import { useEffect, useState } from "react";
import { setAccountBalance } from "app/store/releaseSlice";

function StatementsApp() {
    const dispatch = useDispatch()
    const accountBalance = useSelector(state => state.release.accountBalance)

    useEffect(() => {
        dispatch(setAccountBalance({ key: 'cett', value: null }));
        dispatch(setAccountBalance({ key: 'cb', value: null }));
    }, [])

  return (
      <>

          <div className="p-24 pt-10">
                        
              <Box className='flex flex-col md:flex-row mt-24  spacing-x-2'>
                  <CardBalance type={"Saldo Total das Contas"} amount={100000000} />
                 <CardBalance type={"Saldo do Período - CETT"} amount={accountBalance?.cett} /> 
                 <CardBalance type={"Saldo do Período - CB"} amount={accountBalance?.cb} /> 
              </Box>
               <Box>
                  <Paper>
                      <DataGridStatements />
                  </Paper>
              </Box> 
                <Box>
                  <Paper>
                      <DataGridStatementsCB />
                  </Paper>
              </Box> 
          </div>
      </>
  )
}

export default StatementsApp