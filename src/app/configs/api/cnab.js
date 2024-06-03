import axios from "axios";

const baseURL = 'http://localhost:3001/api/'

export const cnab = axios.create({ baseURL })