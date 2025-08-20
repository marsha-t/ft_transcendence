// import React, { useState } from "react";

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

//Header and Footer
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

//Pages
import Main from "./pages/Main/Main";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import About from "./pages/About/About";


const App: React.FC = () =>{
  return(
    <Router>
      <Header />
      <nav style={{ padding: "10px", backgroundColor: "#f0f0f0" }}>
        <Link to="/" style={{ margin: "0 10px" }}>Home</Link>
        <Link to="/register" style={{ margin: "0 10px" }}>Register</Link>
        <Link to="/login" style={{ margin: "0 10px" }}>Login</Link>
        <Link to="/about" style={{ margin: "0 10px" }}>About</Link>
      </nav>
      <main style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <Footer />

    </Router>
  );
};
// const App: React.FC = () => {
//   const [apiResponse, setApiResponse] = useState<string>("");

//   const handlePing = () => {
//     setApiResponse("Loading...");

//     fetch("/api/ping")
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//         return res.json();
//       })
//       .then((data) => {
//         setApiResponse(JSON.stringify(data));
//       })
//       .catch((err) => {
//         setApiResponse(`Error: ${err.message}`);
//       });
//   };

//   return (
//     <div style={{ padding: "1rem" }}>
//       <h1>Welcome to ft_transcendence frontend!</h1>
//       <button onClick={handlePing}>Ping Backend</button>
//       {apiResponse && (
//         <p>
//           Backend says: <code>{apiResponse}</code>
//         </p>
//       )}
//     </div>
//   );
// };

export default App;
