import React, { createContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  return (
    <UserContext.Provider value={{ userLoggedIn, setUserLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;