import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../css/TabNavigation.css';

const RoomListPage = () => {
  const navigate = useNavigate(); // Used to navigate to the room after joining
  const [rooms, setRooms] = useState([]);
  const [websocket, setWebsocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:3000');
    setWebsocket(ws);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.send(JSON.stringify({ action: 'LIST_CHATROOMS' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'UPDATE_CHATROOMS') {
        setRooms(data.chatrooms);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const handleJoinRoom = (roomCode) => {
    console.log(`Joining room: ${roomCode}`);
    if (websocket) {
      websocket.send(JSON.stringify({ action: 'JOIN_ROOM', roomCode: roomCode }));
      // Assume that the server sends back a confirmation message
      // which you would handle in `ws.onmessage`
      // On confirmation, navigate to the chatroom page
      // For instance:
      // navigate(`/chatroom/${roomCode}`);
    }
  };

  return (
    <div className="room-list-container">
      {/* Your tabs here */}
      <div className="room-list">
        {rooms.length > 0 ? (
          rooms.map((room, index) => (
            <div key={index} className="room-entry">
              <span className="room-name">{`Room Code: ${room.code} - Participants: ${room.participants}`}</span>
              <button onClick={() => handleJoinRoom(room.code)} className="join-button">Join</button>
            </div>
          ))
        ) : (
          <p>No active chatrooms at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default RoomListPage;
