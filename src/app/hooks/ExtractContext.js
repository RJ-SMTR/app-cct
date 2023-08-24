import { useEffect, useState, createContext, useMemo } from 'react';
import { useTheme } from '@mui/styles';
import { api } from 'app/configs/api/api';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';
import { set } from 'lodash';
import { date } from 'yup';

export const ExtractContext = createContext();

export function ExtractProvider({ children }) {
    const [searchingWeek, setSearchingWeek] = useState(false)
    const [statements, setStatements] = useState([])
    const [mapInfo, setMapInfo] = useState([])
    const [previousDays, setPreviousDays] = useState({})
    const [dateRange, setDateRange] = useState([])
    const [searchingDay, setSearchingDay] = useState(false)
    
    function resumeDays(inputData) {
        const groupedData = {}

        inputData.forEach(item => {
            const date = item.dateTime.split('T')[0]
            if (!groupedData[date]) {
                groupedData[date] = [];
            }
            groupedData[date].push(item);
        })

        const result = Object.keys(groupedData).map(date => {
            const group = groupedData[date]
            const totalTransactions = group.reduce((sum, item) => sum + item.transactions, 0)
            const multipliedAmount = group[0].amount * totalTransactions;

            return {
                date,
                multipliedAmount,
                transactions: totalTransactions
            }
        })

        return result
    }

    function getStatements(previousDays, dateRange){
     
        if(dateRange?.length > 0 && !searchingDay){
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
        } else if(searchingDay && searchingWeek) {
            var requestData = {
                startDate: dateRange[0],
                endDate: dateRange[1]
            }
        } else{
            var requestData = previousDays > 0 ? { previousDays: previousDays } : {}
        }
        
        const token = window.localStorage.getItem('jwt_access_token');
        return new Promise((resolve, reject) => {
            const apiRoute = searchingWeek ? jwtServiceConfig.revenues : jwtServiceConfig.bankStatement;
            api.post(apiRoute, 
                requestData, {
                headers: { "Authorization": `Bearer ${token}` },
            }
                )
                .then((response) => {
                    if(searchingWeek){
                        if(searchingDay){
                            setStatements(response.data)
                            setMapInfo(response.data)
                        } else {
                            const weekStatements = resumeDays(response.data)
                            setStatements(weekStatements)
                        }
                        
                    } else {
                        setStatements(response.data)
                    }
                  
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
            const currentValue = statements[i].amount;
            totalSum += currentValue;
            average = totalSum / (i + 1);
        }
        return average.toFixed(2);

    }, [statements])




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
                    y: statement.amount,
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
          value={{ chartOptions, getStatements, previousDays, setPreviousDays, statements, setDateRange, dateRange, searchingWeek, setSearchingWeek, average, mapInfo, setSearchingDay, searchingDay }}
        >
            {children}
        </ExtractContext.Provider>)
}
