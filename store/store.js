import {configureStore} from '@reduxjs/toolkit';
import userNameReducer from './userName';



export const store = configureStore({
    reducer: {
        nameDetails : userNameReducer
    }
});