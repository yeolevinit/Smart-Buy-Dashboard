import { Navigate } from "react-router-dom";

// Check if user is authenticated
const isAuthenticated = () => {
  const user = localStorage.getItem("user");
  return !!user;
};

type ProtectedRouteProps = {
  children: React.ReactElement;
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;



