import { Box, Paper, Card, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import DataGridInfos from './components/DataGrid';
import SynthReport from './components/SynthReport';

function ReportApp() {
    const [selectedReport, setSelectedReport] = useState('');

    const handleSelectChange = (event) => {
        setSelectedReport(event.target.value);
    };

    return (
        <>
            <div className="p-24 pt-10">
                <Card className="w-full p-24 relative mt-32">
                    <header className="flex justify-between items-center">
                        <h3 className="font-semibold mb-24">
                            Seleção de Relatórios
                        </h3>
                    </header>
                    <FormControl style={{minWidth: '20rem'}}>
                        <InputLabel id="report-select-label">Selecionar Relatório</InputLabel>
                        <Select
                            labelId="report-select-label"
                            id="report-select"
                            value={selectedReport}
                            label="Selecionar Relatório"
                            onChange={handleSelectChange}
                        >
                            <MenuItem value="dataGrid">Relatório Analítico</MenuItem>
                            <MenuItem value="synthReport">Relatório Sintético</MenuItem>
                            <MenuItem value="report3">Relatório Consolidado</MenuItem>
                            {/* <MenuItem value="anotherReport">Another Report</MenuItem> */}
                        </Select>
                    </FormControl>
                </Card>

                <Box>
                    <Paper>
                        {selectedReport === 'dataGrid' && <DataGridInfos />}
                        {selectedReport === 'synthReport' && <SynthReport />}
                        {/* {selectedReport === 'report3' && <report3Component />} */}
                    </Paper>
                </Box>
            </div>
        </>
    );
}

export default ReportApp;
