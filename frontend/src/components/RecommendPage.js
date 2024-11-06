import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import axios from 'axios';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
} from '@chatscope/chat-ui-kit-react';
import { Navbar, Container, Button, Modal } from 'react-bootstrap';

import userAvatar from '../assets/images/logo.png';
import clovaAvatar from '../assets/images/logo.png';

const RecommendPage = () => {
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Track if conversation has been saved
  const [alreadySavedModal, setAlreadySavedModal] = useState(false); // For "already saved" popup
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    const initialMessage = {
      message: '안녕하세요! 요리 레시피를 도와드릴 CLOVA X입니다.\n\n먼저 어떤 요리를 하실지 생각하셨나요? 아니면 원하시는 음식 장르나 재료가 있으신가요?',
      direction: 'incoming',
      sender: 'CLOVA X',
      avatar: clovaAvatar,
    };
    setMessages([initialMessage]);
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://reciperecom.store/main', {
        withCredentials: true,
      });
      if (response.data.username) {
        setUsername(response.data.username);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://reciperecom.store/logout', {}, { withCredentials: true });
      setUsername(null);
      navigate('/main');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSend = async (messageText) => {
    if (messageText.trim() === '') return;

    const userMessage = {
      message: messageText,
      direction: 'outgoing',
      sender: '사용자',
      avatar: userAvatar,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsTyping(true);

    try {
      const response = await axios.post('http://reciperecom.store/api/chat', {
        message: messageText,
      });
      const botMessage = {
        message: response.data.response || '죄송합니다. 오류가 발생했습니다.',
        direction: 'incoming',
        sender: 'CLOVA X',
        avatar: clovaAvatar,
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndConversation = async () => {
    if (isSaved) {
      setAlreadySavedModal(true); // Show "already saved" modal if conversation is already saved
      return;
    }

    try {
      await axios.post('http://reciperecom.store/api/save-conversation', {
        messages,
      }, { withCredentials: true });
      console.log('Conversation saved with Summary');
      setIsSaved(true); // Mark conversation as saved
      setShowModal(true); // Show confirmation modal
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const handleModalClose = () => setShowModal(false);
  const handleAlreadySavedClose = () => setAlreadySavedModal(false);

  const handleConfirm = () => {
    setShowModal(false);
    navigate('/mypage');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/main" onClick={() => window.location.reload()}>
            <img src={clovaAvatar} alt="Logo" style={{ height: '40px' }} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarNav" />
          <Navbar.Collapse id="navbarNav" className="justify-content-end text-end">
            <Navbar.Text className="text-white me-3">
              {username ? `Hello, ${username}!` : 'Hello, Guest!'}
            </Navbar.Text>
            {username ? (
              <>
                <Button as={Link} to="/mypage" variant="outline-light" className="me-2">마이 페이지</Button>
                <Button variant="outline-light" onClick={handleLogout}>로그아웃</Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline-light" className="me-2">로그인</Button>
                <Button as={Link} to="/register" variant="outline-light">회원가입</Button>
              </>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 d-flex flex-column align-items-center" style={{ padding: '20px' }}>
        <MainContainer responsive style={{ width: '100%', maxWidth: '800px' }}>
          <ChatContainer>
            <MessageList
              typingIndicator={isTyping ? <TypingIndicator content="CLOVA X가 입력 중입니다..." /> : null}
              style={{ fontSize: '1.2rem', height: 'calc(100vh - 240px)' }}
            >
              {messages.map((msg, index) => (
                <Message
                  key={index}
                  model={msg}
                  avatarPosition="tl"
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
        
        <Button variant="primary" onClick={handleEndConversation} className="mt-3">
          대화 요약 저장
        </Button>
      </Container>

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>마이 페이지 이동</Modal.Title>
        </Modal.Header>
        <Modal.Body>마이 페이지에서 확인하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            확인
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Already Saved Modal */}
      <Modal show={alreadySavedModal} onHide={handleAlreadySavedClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>알림</Modal.Title>
        </Modal.Header>
        <Modal.Body>이미 저장되었습니다.</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAlreadySavedClose}>
            확인
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RecommendPage;
