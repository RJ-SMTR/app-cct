import { Box, Card, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
  setReportList,
  setReportType,
  setSynthData,
  setTotalSynth,
} from 'app/store/reportSlice';
import AgentsConsolidatedReport from './components/AgentsConsolidatedReport';
import DataGridInfos from './components/DataGrid';
import ConsolidatedReport from './components/ConsolidatedReport';
import FinancialMovement from './components/FinancialMovement';
import SynthReport from './components/SynthReport';
import {
  REPORT_AUDIENCE_OPTIONS,
  shouldShowAudienceSelector,
} from './reportSelection';

function ReportApp() {
  const dispatch = useDispatch();
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('permissionario');

  const resetReportState = () => {
    dispatch(setSynthData([]));
    dispatch(setTotalSynth(''));
    dispatch(setReportList([]));
  };

  const handleSelectChange = (event) => {
    resetReportState();
    setSelectedReport(event.target.value);
  };

  const handleAudienceChange = (event) => {
    resetReportState();
    setSelectedAudience(event.target.value);
  };

  const showAudienceSelector = shouldShowAudienceSelector(selectedReport);

  useEffect(() => {
    dispatch(setReportType(selectedReport));
  }, [dispatch, selectedReport]);

  return (
    <div className="p-24 pt-10">
      <Card className="w-full p-24 relative mt-32">
        <header className="flex justify-between items-center">
          <h3 className="font-semibold mb-24">Seleção de Relatórios</h3>
        </header>
        <Box className="flex gap-16 flex-wrap">
          <FormControl style={{ minWidth: '20rem' }}>
            <InputLabel id="report-select-label">Selecionar Relatório</InputLabel>
            <Select
              labelId="report-select-label"
              id="report-select"
              value={selectedReport}
              label="Selecionar Relatório"
              onChange={handleSelectChange}
            >
              <MenuItem value="analitico" className="Mui-disabled">
                Relatório Analítico
              </MenuItem>
              <MenuItem value="consolidado">Relatório Consolidado</MenuItem>
              <MenuItem value="sintetico" className="Mui-disabled">
                Relatório Sintético
              </MenuItem>
              <MenuItem value="Movimentação Financeira">
                Relatório Movimentação Financeira
              </MenuItem>
            </Select>
          </FormControl>

          {showAudienceSelector ? (
            <FormControl style={{ minWidth: '16rem' }}>
              <InputLabel id="audience-select-label">Selecionar Perfil</InputLabel>
              <Select
                labelId="audience-select-label"
                id="audience-select"
                value={selectedAudience}
                label="Selecionar Perfil"
                onChange={handleAudienceChange}
              >
                {REPORT_AUDIENCE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
        </Box>
      </Card>

      <Box>
        {selectedReport === 'analitico' && <DataGridInfos />}
        {selectedReport === 'consolidado' && selectedAudience === 'permissionario' && (
          <ConsolidatedReport />
        )}
        {selectedReport === 'consolidado' && selectedAudience === 'guardador' && (
          <AgentsConsolidatedReport />
        )}
        {selectedReport === 'sintetico' && <SynthReport />}
        {selectedReport === 'Movimentação Financeira' && <FinancialMovement />}
      </Box>
    </div>
  );
}

export default ReportApp;
