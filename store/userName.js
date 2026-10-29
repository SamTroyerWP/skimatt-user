import { createSlice } from "@reduxjs/toolkit";

const userName = createSlice({
    name : 'userName',
    initialState: {
        firstName : "",
        lastName : "",
        email : "",
        password : "",
        phoneNumber: "",
        profileImage: "",
    },
    reducers: {
        changeFirstName: (state, action) =>{
            state.firstName = action.payload.firstName;
        },
        changeLastName: (state, action) =>{
            state.lastName = action.payload.lastName;
        },
        changeEmail: (state, action) =>{
            state.email = action.payload.email;
        },
        changePassword: (state, action) =>{
            state.password = action.payload.password;
        },
        changePhoneNumber: (state, action) =>{
            state.phoneNumber = action.payload.phoneNumber;
        },
        changeProfileImage: (state, action) =>{
            state.profileImage = action.payload.profileImage;
        }

    }
});

export const changeFirstName = userName.actions.changeFirstName;
export const changeLastName = userName.actions.changeLastName;
export const changeEmail = userName.actions.changeEmail;
export const changePassword = userName.actions.changePassword;
export const changePhoneNumber = userName.actions.changePhoneNumber;
export const changeProfileImage = userName.actions.changeProfileImage;

export default userName.reducer;


