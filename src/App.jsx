import { useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Click3DEffect from "./components/Click3DEffect";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      <Click3DEffect />
      {isLoggedIn ? (
        <Home onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
    </>
  );
}

export default App;