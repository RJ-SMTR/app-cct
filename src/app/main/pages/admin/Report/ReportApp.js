import { Box, Paper } from "@mui/material";
import { useSelector } from "react-redux";
import DataGridInfos from './components/DataGrid'





function ReportApp() {
    


    return (
        <>
            <div className="p-24 pt-10">
                <Box>
                    <Paper>
                        <DataGridInfos />
                    </Paper>
                </Box>
            </div>
        </>
    );
}

export default ReportApp