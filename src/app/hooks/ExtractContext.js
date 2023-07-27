import { useEffect, useState, createContext, useMemo } from 'react';
import { useTheme } from '@mui/styles';
import { api } from 'app/configs/api/api';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';

export const ExtractContext = createContext();

export function ExtractProvider({ children }) {
    const [statements, setStatements] = useState([])
    const [previousDays, setPreviousDays] = useState(7)
    const [dateRange, setDateRange] = useState([])

    function getStatements(previousDays, dateRange){
     
        if(dateRange?.length > 0){
            var separateDate = dateRange.map((i) => {
                const inputDateString = i;
                const dateObj = new Date(inputDateString);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0"); 
                const day = String(dateObj.getDate()).padStart(2, "0");
                const formattedDate = `${year}-${month}-${day}`;
                return formattedDate;
            })
            var requestData = {
                startDate: separateDate[0],
                endDate: separateDate[1]
            }
        } else {
            var requestData = previousDays > 0 ? { previousDays: previousDays } : {}
        }
        
        const token = window.localStorage.getItem('jwt_access_token');
        return new Promise((resolve, reject) => {
            api.post(jwtServiceConfig.bankStatement, 
                requestData, {
                headers: { "Authorization": `Bearer ${token}` },
            }
                )
                .then((response) => {
                    setStatements(response.data)
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        }) 

    }
    
    const average = useMemo(() => {
        let totalSum = 0;
        let average = 0;

        for (let i = 0; i < statements.length; i++) {
            const currentValue = statements[i].receivable;
            totalSum += currentValue;
            average = totalSum / (i + 1);
        }
        return average.toFixed(2);

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
                    y: statement.receivable,
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
                formatter: (value) => `R$${value}`,
            },
        },
        xaxis: {
            type: 'datetime',
        },
    };


      return(  <ExtractContext.Provider
            value={{ chartOptions, getStatements, average, previousDays, setPreviousDays, statements, setDateRange, dateRange}}
        >
            {children}
        </ExtractContext.Provider>)
}
