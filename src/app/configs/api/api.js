import axios from "axios";
let baseURL = '';
if (window.location.hostname === 'localhost') {
    baseURL = 'http://localhost:3001/api/v1/'
}


export const api = axios.create({ baseURL })