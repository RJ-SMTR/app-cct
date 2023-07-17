import axios from "axios";

const baseURL = process.env.BASE_URL_CCT || 'http://localhost:3000/api/v1/'

export const api = axios.create({ baseURL })