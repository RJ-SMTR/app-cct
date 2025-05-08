import { api } from 'app/configs/api/api';
import JwtService from '../auth/services/jwtService';
import jwtServiceConfig from '../auth/services/jwtService/jwtServiceConfig';


const initialState = {
    vanzeiroData: [],
};


const reportVanzeiroSlice = createSlice({
    name: 'vanzeiro',
    initialState,
    reducers: {
        setVanzeiroData: (state, action) => {
            state.vanzeiroData = action.payload;
        },
       
    },
});

export const { vanzeiroData, setVanzeiroData } = reportVanzeiroSlice.actions;
export default reportVanzeiroSlice.reducer;


export const handleReportVanzeiro = (data, id) => async (dispatch) => {
    return new Promise((resolve, reject) => {
        api.put(jwtServiceConfig.endPointVanzeiro + `/${id}`,
            {
                id: id,
                data: [dataInicio,dataFim]
            },
            {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then((response) => {
                if (response.status === 200) {
                    resolve()
                    // dispatch(setVanzeiroData(reposta do back))

                } else {
                    reject(error)
                }
            })
            .catch((error) => {
                reject(error)
            })

    })
}
