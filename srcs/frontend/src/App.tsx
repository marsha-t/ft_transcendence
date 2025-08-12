import React, { useState } from "react";

const App: React.FC = () => {
  const [apiResponse, setApiResponse] = useState<string>("");

  const handlePing = () => {
    setApiResponse("Loading...");

    fetch("/api/ping")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setApiResponse(JSON.stringify(data));
      })
      .catch((err) => {
        setApiResponse(`Error: ${err.message}`);
      });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Welcome to ft_transcendence frontend!</h1>
      <button onClick={handlePing}>Ping Backend</button>
      {apiResponse && (
        <p>
          Backend says: <code>{apiResponse}</code>
        </p>
      )}
    </div>
  );
};

export default App;
