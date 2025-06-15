import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link, Route, Routes } from "react-router-dom";
import Room from "./pages/Room";
import socket from "./socket";
import { useEffect, useState } from "react";
import RoomJoin from "./pages/RoomJoin";

function App() {
  const [socketId, setSocketId] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id ?? "");
    });

    // Optional cleanup
    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <SignedIn>
        <div className="text-center">
          <UserButton />
          <h1 className="text-2xl font-bold mt-4">Welcome to Alpha 👋</h1>

          {socketId ? (
            <Link to={`/room`} className="text-blue-600 underline mt-4 block">
              Enter Your Room
            </Link>
          ) : (
            <p className="text-gray-600 mt-4">Connecting to socket...</p>
          )}

          <Routes>
            <Route path="/room" element={<RoomJoin />} />
            <Route path="/room/:roomId" element={<Room />} />
          </Routes>
        </div>
      </SignedIn>

      <SignedOut>
        <SignIn routing="hash" />
      </SignedOut>
    </div>
  );
}

export default App;
