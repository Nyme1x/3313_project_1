import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './../css/RoomListPage.css'; // Make sure to import the CSS file

const RoomListPage = () => {
  const location = useLocation();
  const rooms = [
    { name: 'Study Group' },
    { name: 'Conference' },
    { name: 'Video games' }
  ];

  const handleJoinRoom = (roomName) => {
    console.log(`Joining room: ${roomName}`);
    // Add your logic to join the room here
  };

  const isTabActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="room-list-container">
      <div className="tabs">
        <Link to="/rooms" className={`tab ${isTabActive('/RoomsListPage') ? 'active' : ''}`}></Link>
        <Link to="/manual-join" className={`tab ${isTabActive('/manual-join') ? 'active' : ''}`}></Link>
        <Link to="/CreateRoom" className={`tab ${isTabActive('/create-room') ? 'active' : ''}`}></Link>
      </div>
      <div className="room-list">
        {rooms.map((room, index) => (
          <div key={index} className="room-entry">
            <span className="room-name">{room.name}</span>
            <button onClick={() => handleJoinRoom(room.name)} className="join-button">Join</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomListPage;
