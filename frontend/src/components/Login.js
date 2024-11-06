import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar, Container, Form, Button, Alert, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaUser, FaLock } from 'react-icons/fa';
import '../assets/styles/Login.css';
import logo from '../assets/images/logo.png';

const Login = ({ setIsLoggedIn }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            if (response.status === 200) {
                setIsLoggedIn(true);
                navigate('/main');
            } else {
                const result = await response.json();
                setError(result.message); // 서버의 오류 메시지를 UI에 표시
            }
        } catch (error) {
            console.error('Error during fetch:', error);
            setError('An error occurred during login');
        }
    };

    return (
        <div className="login-page">
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to="/main">
                        <img src={logo} alt="Logo" height="40" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="navbarNav" />
                    <Navbar.Collapse id="navbarNav" className="justify-content-end text-end">
                        <Button as={Link} to="/register" variant="outline-light" className="me-2">회원가입</Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Card style={{ width: '100%', maxWidth: '500px' }} className="p-4 shadow-sm">
                    <Card.Body>
                        <h2 className="text-center mb-4">로그인</h2>
                        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
                        <Form onSubmit={handleLogin}>
                            <Form.Group controlId="formUsername" className="mb-3">
                                <Form.Label><FaUser /> 아이디</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="아이디를 입력하세요"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="formPassword" className="mb-3">
                                <Form.Label><FaLock /> 비밀번호</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="비밀번호를 입력하세요"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Button type="submit" variant="primary" className="w-100">로그인</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default Login;
