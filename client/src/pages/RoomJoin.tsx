import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoomJoin() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to Alpha 👋</h1>
      <input
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room ID (e.g. alpha123)"
        className="px-4 py-2 border rounded mr-2 w-64"
      />
      <button
        onClick={handleJoin}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Join Room
      </button>
    </div>
  );
}
