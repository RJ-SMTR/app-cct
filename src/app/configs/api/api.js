import axios from "axios";

const baseURL = process.env.BASE_URL_CCT || 'https://api.cct.cluster.mobilidade.dev/api/v1/'

export const api = axios.create({ baseURL })