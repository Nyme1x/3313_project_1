// CreateRoom.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
  const [roomCodes, setRoomCodes] = useState([]);
  const navigate = useNavigate();
  const websocketUrl = 'ws://3.208.31.8:5000';
  let ws;

  useEffect(() => {

    ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const roomCode = event.data;
      console.log(`Room created with code: ${roomCode}`);
      setRoomCodes(prevCodes => [...prevCodes, roomCode]);
    };

    ws.onclose = () => console.log('WebSocket Disconnected');
    ws.onerror = (error) => console.error('WebSocket error:', error);


  }, [navigate]);

  const handleCreateRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send('CREATE');
    } else {
      alert('Web Socket is not open, cannot create a chatroom (No server?)');
    }
  };

  return (
    <div className="containers">
      <div className="create-room-container">
        <div className="create-room-title">Press to Create a New Room</div>
        <button onClick={handleCreateRoom} className="btn">Create Room</button>
        <div className="room-list">
          {roomCodes.map((code, index) => (
            <div key={index} className="room-entry">
              <span>Room Code: {code}</span>
              <button onClick={() => navigate(`/chat/${code}`)} className="join-button">Join</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
