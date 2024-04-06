import React, { useState } from 'react';
import './../css/RoomListPage.css'; // Ensure the CSS path is correct

const CreateRoom = () => {
  const [roomName, setRoomName] = useState('');

  const handleCreateRoom = (e) => {
    e.preventDefault();
    console.log(`Creating room: ${roomName}`);
    // Implement logic to create the room
  };

  return (
    <div className="create-room-container">
      <form onSubmit={handleCreateRoom} className="create-room-form">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter new room name"
          className="input"
          required
        />
        <button type="submit" className="btn">Create Room</button>
      </form>
    </div>
  );
};

export default CreateRoom;
