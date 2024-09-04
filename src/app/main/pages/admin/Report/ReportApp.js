import { Box, Paper, Card, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState, useEffect } from "react";
import DataGridInfos from './components/DataGrid';
import SynthReport from './components/SynthReport';
import ConsolidatedReport from './components/ConsolidatedReport';
import { useDispatch } from "react-redux";
import { setReportList, setReportType, setSynthData, setTotalSynth } from "app/store/reportSlice";


function ReportApp() {

    const dispatch = useDispatch()




    const [selectedReport, setSelectedReport] = useState('');


    const handleSelectChange = (event) => {
        dispatch(setSynthData([]))
        dispatch(setTotalSynth(''))
        dispatch(setReportList([]))
        setSelectedReport(event.target.value);
    };
    useEffect(() => {
        dispatch(setReportType(selectedReport))
    }, [selectedReport])

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
                            <MenuItem value="sintetico">Relatório Sintético</MenuItem>

                            <MenuItem value="consolidado">Relatório Consolidado</MenuItem>
                        </Select>
                    </FormControl>
                </Card>

                <Box>
                        {selectedReport === 'dataGrid' && <DataGridInfos />}
                        {selectedReport === 'sintetico' && <SynthReport />}

                        {selectedReport === 'consolidado' && <ConsolidatedReport />}
                </Box>
            </div>
        </>
    );
}

export default ReportApp;
