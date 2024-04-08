import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../css/TabNavigation.css';

const ManualJoinPage = () => {
    const [roomName, setRoomName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [websocket, setWebsocket] = useState(null); 
    const websocketUrl = 'ws://3.208.31.8:5000';

    useEffect(() => {
        const ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setError('');
        };

        ws.onmessage = (event) => {
            const message = event.data;

            if (message.startsWith('Invalid')) {
                // If the message starts with 'Invalid', it indicates an error
                setError('Invalid room code. Please try again.');
            }
        };

        ws.onerror = () => {
            setError('');
        };

        setWebsocket(ws); // Set the WebSocket connection

        // Clean up function that closes the WebSocket connection
        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [navigate]);

    const handleJoinRoom = () => {
        if (!roomName.trim()) {
            setError('Please enter a room code.');
            return;
        }

        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(`JOIN ${roomName}`);
            console.log(`Attempting to join room: ${roomName}`);
            navigate(`/chat/${roomName}`); // Navigate immediately after attempting to join
        } else {
            console.error('WebSocket is not open. Cannot join room.');
            setError('WebSocket is not open. Cannot join room.');
        }
    };

    return (
        <div className="tab-container">
            <input
                type="text"
                value={roomName}
                onChange={(e) => {
                    setError(''); // Clear error message when user starts typing
                    setRoomName(e.target.value);
                }}
                placeholder="Enter room code"
                className="input"
            />
            <button onClick={handleJoinRoom} className="join-button">
                Join Room
            </button>
            {error && <div className="error-message">{error}</div>} {/* Display error message if any */}
        </div>
    );
};

export default ManualJoinPage;
