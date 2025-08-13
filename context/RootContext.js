import { AppProvider } from './AppContext';
import { UserProvider } from './UserContext';

// Root provider that combines all context providers
export const RootProvider = ({ children }) => {
  return (
    <UserProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </UserProvider>
  );
};