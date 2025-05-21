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
import { useSelector } from "react-redux";
import CardBalance from "../Approval/components/CardBalance";
import { useState } from "react";

function StatementsApp() {
    const [selectBalance, setSelectedBalance] = useState("");


        const handleSelectChange = (event) => {
            setSelectedBalance(event.target.value);
        };

  return (
      <>

          <div className="p-24 pt-10">
                            {/* <Card className="w-full p-24 relative mt-32">
                                <header className="flex justify-between items-center">
                                    <h3 className="font-semibold mb-24">Seleção de Conta</h3>
                                </header>
              <FormControl style={{ minWidth: "20rem" }}>
                  <InputLabel id="report-select-label">
                      Selecionar Conta
                  </InputLabel>
                  <Select
                      labelId="report-select-label"
                      id="report-select"
                      value={selectBalance}
                      label="Selecionar Relatório"
                      onChange={handleSelectChange}
                  >
                      <MenuItem value="cett">Extrato CETT</MenuItem>
                      <MenuItem value="cb">Extrato CB</MenuItem>
                    
                  </Select>
              </FormControl>
              </Card> */}
              <Box className='flex flex-col md:flex-row mt-24  spacing-x-2'>
                  <CardBalance type={"Saldo Total das Contas"} amount={100000000} />
                 <CardBalance type={"Saldo do Período - CETT"} amount={109000} /> 
                 <CardBalance type={"Saldo do Período - CB"} amount={109000} /> 
              </Box>
               {/* <Box>
                  <Paper>
                      {selectBalance === "cett" && <DataGridStatements />}
                      {selectBalance === "cb" && <DataGridStatementsCB />}
                  </Paper>
              </Box>  */}
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