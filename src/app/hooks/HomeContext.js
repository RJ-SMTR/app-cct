import {  createContext, useState } from 'react';


export const HomeContext = createContext();

export function HomeProvider({ children }) {



        <HomeContext.Provider value={{ }}>
            {children}
        </HomeContext.Provider>
}
