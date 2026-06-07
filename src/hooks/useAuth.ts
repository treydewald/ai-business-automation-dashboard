/**
 * useAuth hook for accessing authentication state and methods
 */
import { useAuthContext } from "../contexts/AuthContext";

export const useAuth = () => {
  return useAuthContext();
};
