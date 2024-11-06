import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Container, Button, Form, Card, Alert, ListGroup } from 'react-bootstrap';
import logo from '../assets/images/logo.png';

const MyPage = () => {
    const [userInfo, setUserInfo] = useState({
        username: '',
        email: '',
        favoriteFood: '',
        spiceLevel: '',
        newPassword: ''
    });
    const [conversations, setConversations] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await axios.get('http://reciperecom.store/api/main', { withCredentials: true });
                setUserInfo(response.data);
            } catch (error) {
                console.error('Error fetching user info:', error);
                navigate('/login');
            }
        };

        const getConversations = async () => {
            try {
                const response = await axios.get('http://reciperecom.store/api/conversations', { withCredentials: true });
                setConversations(response.data.conversations);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        };

        fetchUserInfo();
        getConversations();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo({ ...userInfo, [name]: value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put('http://reciperecom.store/api/update-user', {
                favoriteFood: userInfo.favoriteFood,
                spiceLevel: userInfo.spiceLevel
            }, { withCredentials: true });
            setSuccess(response.data.message);
            setError('');
        } catch (error) {
            setError('Failed to update user information');
            setSuccess('');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!userInfo.newPassword) {
            setError('Please enter a new password');
            return;
        }
        try {
            const response = await axios.post('http://reciperecom.store/api/change-password', {
                newPassword: userInfo.newPassword
            }, { withCredentials: true });
            setSuccess(response.data.message);
            setError('');
        } catch (error) {
            setError('Failed to change password');
            setSuccess('');
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://reciperecom.store/api/logout', {}, { withCredentials: true });
            navigate('/main');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleDeleteConversation = async (id) => {
        try {
            await axios.delete(`http://reciperecom.store/api/conversation/${id}`, { withCredentials: true });
            setConversations(conversations.filter((conv) => conv.id !== id));
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    return (
        <div>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to="/main">
                        <img src={logo} alt="Logo" style={{ height: '40px' }} />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="navbarNav" />
                    <Navbar.Collapse id="navbarNav" className="justify-content-end text-end">
                        <Navbar.Text className="text-white me-3">
                            {userInfo.username ? `Hello, ${userInfo.username}!` : 'Hello, Guest!'}
                        </Navbar.Text>
                        {userInfo.username ? (
                            <>
                        
                                <Button as={Link} to="/recommend" variant="outline-light" className="me-2">메뉴 추천</Button>
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

            <Container className="mt-4">
                <h1 className="mb-4">마이페이지</h1>
                
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Card className="mb-4">
                    <Card.Body>
                        <h5 className="mb-3">사용자 정보</h5>
                        <Form onSubmit={handleUpdate}>
                            <Form.Group className="mb-3">
                                <Form.Label>아이디: {userInfo.username || ''}</Form.Label>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>이메일: {userInfo.email || ''}</Form.Label>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>즐겨먹는 음식</Form.Label>
                                <Form.Select
                                    name="favoriteFood"
                                    value={userInfo.favoriteFood || ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="한식">한식</option>
                                    <option value="중식">중식</option>
                                    <option value="일식">일식</option>
                                    <option value="양식">양식</option>
                                    <option value="기타">기타</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>맵기 정도</Form.Label>
                                <Form.Select
                                    name="spiceLevel"
                                    value={userInfo.spiceLevel || ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </Form.Select>
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100">정보 수정</Button>
                        </Form>
                    </Card.Body>
                </Card>

                <Card className="mb-4">
                    <Card.Body>
                        <h5 className="mb-3">비밀번호 변경</h5>
                        <Form onSubmit={handlePasswordChange}>
                            <Form.Group className="mb-3">
                                <Form.Label>새 비밀번호</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="newPassword"
                                    value={userInfo.newPassword}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100">비밀번호 변경</Button>
                        </Form>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Body>
                        <h5 className="mb-3">대화 요약</h5>
                        {conversations.length > 0 ? (
                            <ListGroup variant="flush">
                                {conversations.map((conv) => (
                                    <ListGroup.Item key={conv.id} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>대화 종료 시간: {conv.created_at}</strong>
                                            <p>{conv.summary_text}</p>
                                        </div>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteConversation(conv.id)}>
                                            삭제
                                        </Button>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        ) : (
                            <p>요약된 대화가 없습니다.</p>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default MyPage;
