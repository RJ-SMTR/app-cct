import axios from "axios";

const baseURL = 'https://api.cct.mobilidade.rio/api/v1/'

export const api = axios.create({ baseURL })