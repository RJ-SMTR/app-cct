import { createContext, useMemo } from 'react';
import { useTheme } from '@mui/styles';
import { useSelector } from 'react-redux';


export const ExtractContext = createContext();

export function ExtractProvider({ children }) {
const statements = useSelector(state => state.extract.statements)



    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    const average = useMemo(() => {
        let totalSum = 0;
        let average = 0;
        for (let i = 0; i < statements.length; i++) {
            const currentValue = statements[i].amount ?? statements[i].transactionValueSum;
            totalSum += currentValue;
            average = totalSum / (i + 1);
        }
        return formatter.format(average);

    }, [statements]);


   
  
    const theme = useTheme()
    const reversedStatements = [...statements].reverse()
    const chartOptions = {
        chart: {
            animations: {
                speed: 400,
                animateGradually: {
                    enabled: false,
                },
            },
            fontFamily: 'inherit',
            foreColor: 'inherit',
            width: '100%',
            height: '100%',
            type: 'bar',
            sparkline: {
                enabled: false,
            },
            toolbar: {
                show: false,
            },
        },
        colors: [theme.palette.secondary.dark],
        fill: {
            colors: [theme.palette.secondary.dark],
            opacity: 0.7, 
        },
      

        series: [
            {
                name: 'Recebido',
                data: reversedStatements.map((statement) => ({
                    x: statement.date ?? statement.partitionDate,
                    y: statement.amount ?? statement.transactionValueSum,
                })),
            },
        ],
        xaxis: {
            show: false
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return formatter.format(value);
                },
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
            },
        },
        dataLabels: {
            enabled: false, 
        },
        tooltip: {
            followCursor: true,
            theme: 'dark',
         
            y: {
                formatter: function (value) {
                    return formatter.format(value);
                },
            },
        },
    };



      return(  <ExtractContext.Provider
          value={{ chartOptions, average}}
        >
            {children}
        </ExtractContext.Provider>)
}
