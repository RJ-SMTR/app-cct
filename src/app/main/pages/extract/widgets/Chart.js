import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import ReactApexChart from 'react-apexcharts';
import { useContext } from 'react';
import { ExtractContext } from 'src/app/hooks/ExtractContext';
import { useSelector } from 'react-redux';

function Chart() {
    const {chartOptions, average} = useContext(ExtractContext)

    const statements = useSelector(state => state.extract.statements)

    const firstDate = new Date(`${statements[0]?.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'Etc/UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
    const lastDate = new Date(`${statements[statements.length - 1 ]?.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'Etc/UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
  return (
      <Paper className="flex flex-col flex-auto shadow rounded-2xl overflow-hidden md:w-[60%]">
          <div className="flex flex-col p-12 pb-16">
              <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                      <Typography className="mr-16 text-lg font-medium tracking-tight leading-6 truncate">
                          Média das entradas
                      </Typography>
                      <Typography className="font-medium text-sm">
                        {firstDate} - {lastDate}
                      </Typography>
                  </div>

             
              </div>
              <div className="flex items-start mt-12 mr-8">
                  <div className="flex flex-col">
                      <Typography className="font-semibold text-3xl md:text-5xl tracking-tighter">
                        R$ {average}
                      </Typography>
                   
                  </div>
                 
              </div>
          </div>
          <div className="flex flex-col flex-auto">
              <ReactApexChart
                  className="flex-auto w-full h-full"
                  options={chartOptions}
                  series={chartOptions.series}
                  type={chartOptions.chart.type}
                  height={chartOptions.chart.height}
              />
          </div>
      </Paper>
  )
}

export default Chart