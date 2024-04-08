import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useHistory for navigation
import './../css/Chatting.css';

const Chatting = () => {
  const { roomCode } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false); 
  const ws = useRef(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const currentUser = localStorage.getItem('username'); 
  const chatContentRef = useRef(null);
  const websocketUrl = 'ws://3.208.31.8:5000';
  const Navigate = useNavigate(); 

  const scrollToBottom = () => {
    const scrollHeight = chatContentRef.current.scrollHeight;
    const height = chatContentRef.current.clientHeight;
    const maxScrollTop = scrollHeight - height;
    chatContentRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  };

  
  
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
        setMessages((prevMessages) => [...prevMessages, { sender: senderUsername, content: messageContent, isVoice: false }]);
      } else if (event.data instanceof Blob) {
        const audioURL = URL.createObjectURL(event.data);
        setMessages((prevMessages) => [...prevMessages, { sender: 'Voice Message', content: audioURL, isVoice: true }]);
      }
    };

    ws.current.onclose = () => console.log('WebSocket Disconnected');
    ws.current.onerror = (error) => console.error('WebSocket error:', error);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomCode]);





  const Message = React.memo(({ message, index }) => {
    const isCurrentUserMessage = message.sender === currentUser; // Ensure `currentUser` is available in the context or passed as a prop
  
    useEffect(() => {
      return () => {
        if (message.isVoice) {
          URL.revokeObjectURL(message.content);
        }
      };
    // This effect depends on `message.content` and `message.isVoice`, so they should be in the dependency array
    }, [message.content, message.isVoice]);
  
    return (
      <div className={`message-bubble ${isCurrentUserMessage ? 'user-message' : 'other-message'}`}>
        {/* Display sender's username for non-current user messages */}
        {!isCurrentUserMessage && <span className="sender-username">{message.sender}: </span>}
        {
          message.isVoice ? (
            // Render an audio control for voice messages
            <audio src={message.content} controls />
          ) : (
            // Display text content for text messages
            message.content
          )
        }
      </div>
    );
  });

  
 

  const sendMessage = () => {
    if (messageInput.trim() !== '') {
      const msg = `MSG:${roomCode}:${messageInput}`;
      ws.current.send(msg);
      setMessageInput('');
      animateMessageSend(); 
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const renderMessage = (message, index) => {
    const isCurrentUserMessage = message.sender === currentUser;
    const isNewMessage = index === messages.length - 1;
  
    return message.isVoice ? (
      <audio key={index} src={message.content} controls />
    ) : (
      <div
        key={index}
        className={`message-bubble ${isCurrentUserMessage ? 'user-message' : 'other-message'} ${isNewMessage ? 'new-message' : ''}`}
      >
        {!isCurrentUserMessage && <span className="sender-username">{message.sender}: </span>}
        {message.content}
      </div>
    );
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

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
    setIsRecording(!isRecording); 
  };

  const sendVoiceMessage = (audioData) => {
    const msg = `VOICE:${roomCode}:${audioData.split(',')[1]}`;
    console.log(msg);
    ws.current.send(msg);
  };

  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };
  

  const animateMessageSend = () => {
    const inputElement = document.querySelector('.input');
    const sendButton = document.querySelector('.sendMessageButton');
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble', 'user-message', 'new-message');
    messageBubble.innerText = messageInput;
    document.body.appendChild(messageBubble);

    const inputRect = inputElement.getBoundingClientRect();
    const sendButtonRect = sendButton.getBoundingClientRect();
    const messageBubbleRect = messageBubble.getBoundingClientRect();

    const deltaX = inputRect.left - messageBubbleRect.left;
    const deltaY = inputRect.top - messageBubbleRect.top;
  
    messageBubble.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
    messageBubble.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    setTimeout(() => {
      messageBubble.style.opacity = '0';
      setTimeout(() => {
        messageBubble.remove();
        inputElement.classList.add('sendAnimation');
        setTimeout(() => inputElement.classList.remove('sendAnimation'), 500); 
      }, 500);
    }, 500);
  };

  // Function to navigate to home page
  const navigateToHomePage = () => {
    Navigate('/'); // Adjust the path as needed
  };

  

  return (
    <div className="chatting-container">
      {/* Home Page Button with existing CSS classes for styling consistency */}
      <button className="sendMessageButton" onClick={navigateToHomePage} style={{position: 'absolute', top: '10px', left: '10px'}}>
        Home Page
      </button>

      <div className="chat-content" ref={chatContentRef}>
        <h2>Chat Room: {roomCode}</h2>
        <div className="display-message"> 
        {messages.map((message, index) => (
        <Message key={index} message={message} index={index} />   
            ))}
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
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatting;
