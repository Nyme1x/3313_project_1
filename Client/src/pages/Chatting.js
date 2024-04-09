import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './../css/Chatting.css'; 
const config = require('../config.js');

let sequenceNumber = 0;

const Chatting = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const ws = useRef(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const currentUser = localStorage.getItem('username');
  const chatContentRef = useRef(null);
  const { websocketUrl } = config;
  const audioRefs = useRef({});

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found in local storage.');
      return;
    }

    ws.current = new WebSocket(websocketUrl);
    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      ws.current.send(`JOIN:${roomCode}:${username}`);
    };

    ws.current.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const [senderUsername, messageContent] = event.data.split(':');
        const id = `${new Date().getTime()}-${sequenceNumber++}`;
        setMessages(prevMessages => [...prevMessages, {
          sender: senderUsername,
          content: messageContent,
          isVoice: false,
          id 
        }]);
      } else if (event.data instanceof Blob) {
        const audioURL = URL.createObjectURL(event.data);
        const id = `${new Date().getTime()}-${sequenceNumber++}`;
        audioRefs.current[id] = audioURL;
        setMessages(prevMessages => [...prevMessages, {
          sender: 'Voice Message',
          content: audioURL,
          isVoice: true,
          id
        }]);
      }
    };

    return () => {
      Object.values(audioRefs.current).forEach(URL.revokeObjectURL);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomCode]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const renderMessage = (message) => {
    const isCurrentUserMessage = message.sender === currentUser;
    if (message.isVoice) {
      return (
        <audio key={message.id} src={audioRefs.current[message.id]} controls />
      );
    } else {
      return (
        <div
          key={message.id}
          className={`message-bubble ${isCurrentUserMessage ? 'user-message' : 'other-message'}`}
        >
          {!isCurrentUserMessage && <span className="sender-username">{message.sender}: </span>}
          {message.content}
        </div>
      );
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() !== '') {
      const msg = `MSG:${roomCode}:${messageInput}`;
      ws.current.send(msg);
      setMessageInput('');
    }
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (e) => {
          chunks.current.push(e.data);
        };
        mediaRecorder.current.start();
        console.log('Recording started');
      })
      .catch((err) => {
        console.error('Error accessing microphone:', err);
      });
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = () => {
          const audioData = reader.result;
          sendVoiceMessage(audioData);
        };
        reader.readAsDataURL(audioBlob);
      };
    }
  };

  const sendVoiceMessage = (audioData) => {
    const msg = `VOICE:${roomCode}:${audioData.split(',')[1]}`;
    ws.current.send(msg);
  };

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
    setIsRecording(!isRecording);
  };

  const goBackToRooms = () => {
    navigate('/rooms');
  };

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatting-container">
      <div className="chat-content" ref={chatContentRef}>
        <h2>Chat Room: {roomCode}</h2>
        <button onClick={goBackToRooms} className="backToRoomsButton">Back to Rooms</button>
        <div className="display-message">
          {messages.map(renderMessage)}
        </div>
        <div className="messaging-form">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="input"
          />
          <button onClick={sendMessage} className="sendMessageButton">Send</button>
          <button onClick={toggleRecording} className={`recordButton ${isRecording ? 'recording' : ''}`}>
            {isRecording ? <i className="fas fa-stop"></i> : <i className="fas fa-microphone"></i>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatting;
