    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import './../css/TabNavigation.css';

    const ManualJoinPage = () => {
    const [roomName, setRoomName] = useState('');
    const navigate = useNavigate();

    const handleJoinRoom = () => {
        console.log(`Joining room: ${roomName}`);
    };

    return (
        <div className="tab-container">
        <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            className="input"
        />
        <button onClick={handleJoinRoom} className="join-button">Join Room</button>
        </div>
    );
    };

    export default ManualJoinPage;
