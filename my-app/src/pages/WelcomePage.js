import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../css/WelcomePage.css';
import Globe from './../images/globe.png';

const WelcomePage = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const websocketUrl = 'ws://3.208.31.8:5000';
  
  useEffect(() => {
    if (username.trim()) {
      const socket = new WebSocket(websocketUrl);
      socket.onopen = () => {
        socket.send(`SET_USERNAME:${username}`);
      };
      socket.onclose = () => {
        console.log('Socket closed');
      };
      socket.onmessage = (event) => {
        console.log(event.data); 
        if (event.data === 'Username set successfully') {
          localStorage.setItem('username', username);
          navigate('/rooms'); 
        } else {
          setError('Error setting username');
        }
      };
    }
  }, [username, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (username.trim()) {
      console.log(`Username entered: ${username}`);
      localStorage.setItem('username', username);
      
      navigate('/rooms'); 
    } else {
      setError('Please enter a username.');
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <img src={Globe} alt="Globe" className="globe-img" />
      <div className="form-container text-center p-8 bg-white shadow-xl rounded-2xl animate-container">
        <h1 className="animated-typing">Welcome to ChatterSphere!</h1>
        <p className="text-xl text-blue-500 mb-8 animated-subtext">Please enter a username to start chatting today!</p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col items-center relative animated-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="mb-4 px-4 py-2 border-2 border-blue-500 rounded-lg text-blue-700 focus:ring-blue-400 focus:border-blue-400 block w-full animated-input"
          />
          <button
            type="submit"
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 animated-button"
          >
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomePage;
