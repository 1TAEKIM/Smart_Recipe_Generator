import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
} from '@chatscope/chat-ui-kit-react';

// 사용자와 Clova X의 아바타 이미지를 import
import userAvatar from '../assets/images/logo.png';
import clovaAvatar from '../assets/images/logo.png';

const RecommendPage = () => {
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();

  // 페이지 처음 로드 시 초기 메시지와 사용자 정보 설정
  useEffect(() => {
    fetchUserData();
    const initialMessage = {
      message: '안녕하세요! 요리 레시피를 도와드릴 CLOVA X입니다.\n\n먼저 어떤 요리를 하실지 생각하셨나요? 아니면 원하시는 음식 장르나 재료가 있으신가요?',
      direction: 'incoming',
      sender: 'CLOVA X',
      avatar: clovaAvatar // Clova X의 아바타 이미지
    };
    setMessages([initialMessage]);
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5001/main', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.username) {
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    const response = await fetch('http://localhost:5001/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (response.status === 200) {
      setUsername(null);
      navigate('/main');
    }
  };

  const handleSend = async (messageText) => {
    if (messageText.trim() === '') return;

    const userMessage = {
      message: messageText,
      direction: 'outgoing',
      sender: '사용자',
      avatar: userAvatar // 사용자 아바타 이미지
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();
      const botMessage = {
        message: data.response || '죄송합니다. 오류가 발생했습니다.\n빠른 시일내 복구하겠습니다.',
        direction: 'incoming',
        sender: 'CLOVA X',
        avatar: clovaAvatar // Clova X의 아바타 이미지
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error fetching chat:', error);
      const errorMessage = {
        message: '죄송합니다. 오류가 발생했습니다.\n빠른 시일내 복구하겠습니다.',
        direction: 'incoming',
        sender: 'CLOVA X',
        avatar: clovaAvatar // Clova X의 아바타 이미지
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontSize: '1.2rem' }}>
      {/* 상단바 */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link to="/main" className="navbar-brand">
            <img src={clovaAvatar} alt="Logo" height="40" />
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {username ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link">Hello, {username}!</span>
                  </li>
                  <li className="nav-item">
                    <Link to="/recommend" className="nav-link">메뉴 추천</Link>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/register" className="nav-link">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* 채팅 UI */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MainContainer responsive>
          <ChatContainer>
            <MessageList
              typingIndicator={
                isTyping ? <TypingIndicator content="CLOVA X가 입력 중입니다..." /> : null
              }
              style={{ fontSize: '1.2rem', height: 'calc(100vh - 160px)' }}
            >
              {messages.map((msg, index) => (
                <Message
                  key={index}
                  model={msg}
                  avatarPosition="tl" // 아바타 위치 (top-left)
                >
                  <Avatar src={msg.avatar} name={msg.sender} size="md" />
                </Message>
              ))}
            </MessageList>
            <MessageInput
              placeholder="메시지를 입력하세요..."
              onSend={handleSend}
              attachButton={false}
              style={{ fontSize: '1.2rem' }}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
};

export default RecommendPage;
