import axios from "axios";

const baseURL = 'https://api.cct.hmg.mobilidade.rio/api/v1/'

export const api = axios.create({ baseURL })