// RoomListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner'; 
import './../css/RoomListPage.css';
import './../css/WelcomePage.css';

const RoomListPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true); 
  const websocketUrl = 'ws://3.208.31.8:5000';

  useEffect(() => {
  
    const socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
      console.log("Connected to the server");
      socket.send("LIST_CHATROOMS");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) { 
          setRooms(data.map(room => room.room_code));
        }
      } catch (error) {
        console.error("Error parsing message from server:", error);
      }
    };

    setTimeout(() => {
      setLoading(false); 
    }, 1000);

    return () => {
      socket.close(); 
    };
  }, []);

  return (
    <div className="room-list-container">
      {loading ?(
        <LoadingSpinner />
      ) : (
        <div className="room-list">
          {rooms.length > 0 ? (
            rooms.map((roomCode, index) => (
              <div key={index} className="room-entry">
                <span className="room-name">{`Room Code: ${roomCode}`}</span>
                <Link to={`/chat/${roomCode}`} className="join-button">Join</Link>
              </div>
            ))
          ) : (
            <p>No active chatrooms at the moment.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomListPage;
