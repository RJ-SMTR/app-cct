import { createContext, useEffect, useState } from 'react';
import { api } from 'app/configs/api/api';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';


export const ResumeContext = createContext();

export function ResumeProvider({ children }) {
    const [resume, setResume] = useState([])
    
    function getResume(previousDays, dateRange) {
        if (dateRange?.length > 0) {
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
            api.post(jwtServiceConfig.resumeTrips,
                requestData, {
                headers: { "Authorization": `Bearer ${token}` },
            }
            )
                .then((response) => {
                    setResume(response.data)
                    console.log(response.data)
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })

    } 
 



    return (
        <ResumeContext.Provider value={{getResume, resume}}>
            {children}
        </ResumeContext.Provider>
    )
}
