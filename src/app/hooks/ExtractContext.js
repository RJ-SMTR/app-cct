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
            const currentValue = statements[i].amount ?? statements[i].multipliedAmount;
            totalSum += currentValue;
            average = totalSum / (i + 1);
        }
        return formatter.format(average);

    }, [statements]);


   
  
    const theme = useTheme()
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
            type: 'area',
            sparkline: {
                enabled: true,
            },
        },
        colors: [theme.palette.secondary.dark, theme.palette.secondary.dark],
        fill: {
            colors: [theme.palette.secondary.dark, theme.palette.secondary.dark],
            opacity: 0.5,
        },
        series: [
            {
                "name": "Recebido",
                data: statements.map((statement) => ({
                    x: statement.date,
                    y: statement.amount ?? statement.multipliedAmount,
                })),

            },

        ],
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        tooltip: {
            followCursor: true,
            theme: 'dark',
            x: {
                format: ' dd MMM, yyyy',
            },
            y: {
                formatter: function(value){
                    return formatter.format(value)
                } 
            },
        },
        xaxis: {
            type: 'datetime',
        },
    };


      return(  <ExtractContext.Provider
          value={{ chartOptions, average}}
        >
            {children}
        </ExtractContext.Provider>)
}
