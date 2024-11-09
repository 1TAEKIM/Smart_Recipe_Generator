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
import SearchTrend from './SearchTrend';  // SearchTrend 컴포넌트 임포트

const RecommendPage = () => {
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [alreadySavedModal, setAlreadySavedModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Track recording state
  const [recordingTimeout, setRecordingTimeout] = useState(null); // Timeout to handle 5 seconds of silence
  const [isVoiceMode, setIsVoiceMode] = useState(false); // Track if voice mode is enabled
  const [showSearchTrend, setShowSearchTrend] = useState(false); // 검색어 트렌드 조회 모달 상태

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
      const response = await axios.get('https://reciperecom.store/api/main', {
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
      await axios.post('https://reciperecom.store/api/logout', {}, { withCredentials: true });
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
      const response = await axios.post('https://reciperecom.store/api/chat', {
        message: messageText,
        username: username,
      });
      const botMessage = {
        message: response.data.response || '죄송합니다. 오류가 발생했습니다.',
        direction: 'incoming',
        sender: 'CLOVA X',
        avatar: clovaAvatar,
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);

      // 음성 대화 모드가 활성화된 경우에만 TTS 재생
      if (isVoiceMode) {
        playVoice(botMessage.message);
      }
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
      await axios.post('https://reciperecom.store/api/save-conversation', {
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

  const startVoiceProcess = () => {
    setIsVoiceMode(true); // 음성 대화 모드 활성화
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm; codecs=opus" });
        mediaRecorder.start();
        setIsRecording(true);

        mediaRecorder.ondataavailable = async (event) => {
          const audioBlob = event.data;
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            const sttResponse = await axios.post('https://reciperecom.store/api/speech-to-text', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            const userMessage = sttResponse.data.transcript || "음성 인식을 할 수 없습니다.";
            const clovaResponse = await axios.post('https://reciperecom.store/api/chat', { message: userMessage });
            const botMessage = clovaResponse.data.response || '죄송합니다. 오류가 발생했습니다.';

            setMessages((prevMessages) => [
              ...prevMessages,
              { message: userMessage, direction: 'outgoing', sender: '사용자', avatar: userAvatar },
              { message: botMessage, direction: 'incoming', sender: 'CLOVA X', avatar: clovaAvatar },
            ]);
            if (isVoiceMode) {
              playVoice(botMessage);
            }
          } catch (error) {
            console.error("음성 인식/응답 오류:", error);
            alert("음성 인식에 실패했습니다. 다시 시도해주세요.");
          } finally {
            setIsRecording(false);
            stream.getTracks().forEach((track) => track.stop());
          }
        };

        mediaRecorder.onstop = () => {
          setIsRecording(false);
          clearTimeout(recordingTimeout);
        };

        const timeoutId = setTimeout(() => mediaRecorder.stop(), 5000);
        setRecordingTimeout(timeoutId);
      })
      .catch((error) => {
        console.error("음성 녹음 오류:", error);
        alert("마이크 권한이 필요합니다.");
      });
  };

  const playVoice = async (text) => {
    try {
      const response = await axios.post('https://reciperecom.store/api/play_voice', { text }, {
        responseType: 'arraybuffer',
      });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(response.data);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error with TTS playback:', error);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand onClick={() => navigate('/main')}>
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
                <Message key={index} model={msg} avatarPosition="tl">
                  <Avatar src={msg.avatar} name={msg.sender} size="md" />
                </Message>
              ))}
            </MessageList>
            <MessageInput
              placeholder="가지고 계신 재료를 입력해주세요..."
              onSend={handleSend}
              attachButton={false}
              style={{ fontSize: '1.2rem' }}
            />
          </ChatContainer>
        </MainContainer>

        <div className="d-flex mt-3">
          <Button variant="primary" onClick={handleEndConversation}>
            대화 요약 저장
          </Button>
          <Button variant="secondary" onClick={startVoiceProcess} className="ms-2">
            {isRecording ? '녹음 중...' : '음성 대화 시작'}
          </Button>
          {/* <Button variant="info" onClick={() => setShowSearchTrend(true)} className="ms-2">
            검색어 트렌드 조회
          </Button> */}
        </div>
      </Container>

      {/* SearchTrend 모달 컴포넌트 */}
      <SearchTrend show={showSearchTrend} handleClose={() => setShowSearchTrend(false)} />

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
