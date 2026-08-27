import { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Click3DEffect from "./components/Click3DEffect";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("Supplier"); // Supplier or Buyer

  const handleLogin = (role) => {
    setUserRole(role || "Supplier");
    setIsLoggedIn(true);
  };

  return (
    <>
      <Click3DEffect />
      {isLoggedIn ? (
        <Home role={userRole} onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;