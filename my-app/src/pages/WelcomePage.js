import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Globe from './../images/globe.png';   

import './../css/WelcomePage.css'; 

const WelcomePage = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate(); 

  const handleSubmit = (event) => {
    event.preventDefault();
    if (username) {
      console.log(`Username entered: ${username}`);
      navigate('/rooms'); 
    } else {
      alert('Please enter a username.');
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <img src={Globe} alt="Globe" className="globe-img" />
      <div className="form-container text-center p-8 bg-white shadow-xl rounded-2xl animate-container">
      <h1 className="animated-typing">Welcome to ChatterSphere!</h1>
        <p className="text-xl text-blue-500 mb-8 animated-subtext">Please enter a username to start chatting today!</p>
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
