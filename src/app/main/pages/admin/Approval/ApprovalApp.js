import { Box, Paper } from "@mui/material";
import CardBalance from "./components/CardBalance";
import DataGridInfos from "./components/DataGrid";
import CardSelection from "./components/CardSelection";




function ApprovalApp() {
 

    return (
        <>
            <div className="p-24 pt-10">
            <Box className='flex flex-col md:flex-row mt-24 max-w-[684px] spacing-x-2'>
                <CardBalance type={"Saldo da Banco"} amount={1000000}/>
            </Box>
                <CardSelection/>
            <Box>
                <Paper>
                    <DataGridInfos/>
                </Paper>
            </Box>
            </div>
        </>
    );
}

export default ApprovalApp