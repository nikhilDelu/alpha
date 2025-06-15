import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";

export default function Room() {
  const { roomId } = useParams();
  const { user } = useUser();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);


  useEffect(() => {
    if (remoteVideoRef.current) {
      // @ts-ignore
      window.remoteVideo = remoteVideoRef.current;
    }
  }, []);

  useEffect(() => {
    socket.emit("join-room", { roomId, userId: user?.id });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      });

    // Handle remote user joining
    socket.on("user-joined", async (remoteSocketId) => {
      console.log("Another user joined:", remoteSocketId);

      const peer = createPeer(remoteSocketId);
      peerConnectionRef.current = peer;

      // Add local tracks
      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current!);
      });

      // ✅ Create offer only if you are the *first* user (i.e. already in the room)
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("offer", {
        targetId: remoteSocketId,
        offer,
      });
    });

    // Handle offer
    socket.on("offer", async ({ senderId, offer }) => {
      console.log("Received offer from", senderId);

      const peer = createPeer(senderId);
      peerConnectionRef.current = peer;

      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current!);
      });

      await peer.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer", {
        targetId: senderId,
        answer,
      });
    });

    // Handle answer
    socket.on("answer", async ({ answer }) => {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    // Handle ICE
    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(candidate);
      } catch (err) {
        console.error("ICE Error:", err);
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [roomId, user]);

  const createPeer = (targetId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          targetId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      const stream = event.streams[0];
      console.log("📹 Remote stream received:", stream);
      console.log("Tracks:", stream.getTracks());

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play(); // Force play
        console.log("🎬 remoteVideoRef srcObject set");
        setRemoteConnected(true);
      }
    };

    return peer;
  };

  return (
    <div className="p-6 text-center">
      <div className="flex items-center justify-between bg-white px-4 py-2 shadow-md fixed top-0 left-0 right-0 z-10">
        <h2 className="text-lg font-semibold text-gray-700">Room: {roomId}</h2>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">{user?.fullName}</p>
          <UserButton />
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-4 justify-center items-center px-4">
        <div className="bg-black rounded-lg overflow-hidden shadow-lg relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-64 object-cover"
          />
          <p className="absolute bottom-2 left-2 text-white text-sm font-semibold">
            You
          </p>
        </div>

        <div className="bg-black rounded-lg overflow-hidden shadow-lg relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false} // You can toggle this later
            className="w-full h-64 object-cover"
          />
          <p className="absolute bottom-2 left-2 text-white text-sm font-semibold">
            Remote
          </p>
        </div>
      </div>
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-6">
        <button className="bg-gray-700 text-white px-4 py-2 rounded-full shadow hover:bg-gray-800">
          🎙️ Mute
        </button>
        <button className="bg-gray-700 text-white px-4 py-2 rounded-full shadow hover:bg-gray-800">
          🎥 Toggle Video
        </button>
        <button className="bg-red-600 text-white px-4 py-2 rounded-full shadow hover:bg-red-700">
          🚪 Leave
        </button>
      </div>
    </div>
  );
}
