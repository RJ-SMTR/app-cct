import { Box, Paper } from "@mui/material";
import CardBalance from "./components/CardBalance";
import DataGridInfos from "./components/DataGrid";
import CardSelection from "./components/CardSelection";
import { useSelector } from "react-redux";





function ApprovalApp() {
 const selectedPeriod = useSelector(state => state.release.selectedPeriod)
 const listTransactions = useSelector(state => state.release.listTransactions)

    return (
        <>
            <div className="p-24 pt-10">
            <Box className='flex flex-col md:flex-row mt-24 max-w-[684px] spacing-x-2'>
                <CardBalance type={"Saldo da Banco"} amount={100000000}/>
                    {selectedPeriod ? <CardBalance type={"Valor Autorizado"} amount={4800000} />: null}
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