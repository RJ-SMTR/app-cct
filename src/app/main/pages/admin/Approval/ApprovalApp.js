import { Box, Paper } from "@mui/material";
import CardBalance from "./components/CardBalance";
import DataGridInfos from "./components/DataGrid";
import CardSelection from "./components/CardSelection";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { handleAuthValue, setSelectedPeriod } from "app/store/releaseSlice";





function ApprovalApp() {
 const selectedPeriod = useSelector(state => state.release.selectedPeriod)
 const listTransactions = useSelector(state => state.release.listTransactions)
 const authValue = useSelector(state => state.release.authValue)


    return (
        <>
            <div className="p-24 pt-10">
            <Box className='flex flex-col md:flex-row mt-24 max-w-[684px] spacing-x-2'>
                <CardBalance type={"Saldo da Banco"} amount={100000000}/>
                    {selectedPeriod ? <CardBalance type={"Valor Autorizado"} amount={authValue} />: null}
            </Box>
                <CardSelection/>
                {selectedPeriod ? <Box>
                    <Paper>
                        <DataGridInfos data={listTransactions}  />
                    </Paper>
                </Box> : null}
            </div>
        </>
    );
}

export default ApprovalApp