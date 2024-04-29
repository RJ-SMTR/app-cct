import { Box, Paper } from "@mui/material";
import DataGridStatements from "../Approval/components/DataGridStatements"
import DataGridStatementsCB from "../Approval/components/DataGridStatementsCB"
import { useSelector } from "react-redux";
import CardBalance from "../Approval/components/CardBalance";
import CardSelection from "../Approval/components/CardSelection";

function StatementsApp() {
    const selectedPeriod = useSelector(state => state.release.selectedPeriod)
    const listTransactions = useSelector(state => state.release.listTransactions)
    const authValue = useSelector(state => state.release.authValue)

  return (
      <>
          <div className="p-24 pt-10">
              <Box className='flex flex-col md:flex-row mt-24  spacing-x-2'>
                  <CardBalance type={"Saldo Total das Contas"} amount={100000000} />
                 <CardBalance type={"Saldo do Período - CETT"} amount={109000} /> 
                 <CardBalance type={"Saldo do Período - CB"} amount={109000} /> 
              </Box>
               <Box>
                  <Paper>
                      <DataGridStatements data={listTransactions} />
                  </Paper>
              </Box> 
               <Box>
                  <Paper>
                      <DataGridStatementsCB data={listTransactions} />
                  </Paper>
              </Box> 
          </div>
      </>
  )
}

export default StatementsApp