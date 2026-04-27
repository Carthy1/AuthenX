import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if a user is currently saved in local state
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.email) {
    // If no user, redirect them to the home page
    return <Navigate to="/" replace />;
  }

  // If user exists, let them pass through to the dashboard
  return children;
};

export default ProtectedRoute;