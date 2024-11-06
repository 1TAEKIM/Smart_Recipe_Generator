import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Navbar, Container, Card, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/images/logo.png';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [favoriteFood, setFavoriteFood] = useState('');
    const [customFood, setCustomFood] = useState('');
    const [spiceLevel, setSpiceLevel] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false
    });

    const navigate = useNavigate();

    const checkUsernameAvailability = async () => {
        if (username) {
            try {
                const response = await axios.get(`http://reciperecom.store/api/check-username?username=${username}`);
                setIsUsernameAvailable(response.data.available);
            } catch (error) {
                console.error('Error checking username availability:', error);
            }
        }
    };

    useEffect(() => {
        setPasswordValidations({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[!@#$%^&*()_+=-]/.test(password),
        });
    }, [password]);

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://reciperecom.store/api/register', {
                username,
                email,
                password,
                favoriteFood: favoriteFood === '기타' ? customFood : favoriteFood,
                spiceLevel
            }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });

            if (response.status === 201) {
                setSuccess('회원가입에 성공했습니다.');
                setError('');
                navigate('/login');
            }
        } catch (error) {
            setError(error.response?.data?.message || '회원가입에 실패했습니다.');
            setSuccess('');
        }
    };

    return (
        <div className="register-page">
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to="/main">
                        <img src={logo} alt="Logo" height="40" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="navbarNav" />
                    <Navbar.Collapse id="navbarNav" className="justify-content-end text-end">
                        <Button as={Link} to="/login" variant="outline-light" className="me-2">로그인</Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>


            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Card style={{ width: '100%', maxWidth: '500px' }} className="p-4 shadow-sm">
                    <Card.Body>
                        <h2 className="text-center mb-4">회원가입</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}

                        <Form onSubmit={handleRegister}>
                            <Form.Group controlId="username" className="mb-3">
                                <Form.Label>아이디</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="아이디를 입력하세요"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={checkUsernameAvailability}
                                />
                                {isUsernameAvailable !== null && (
                                    <Form.Text style={{ color: isUsernameAvailable ? 'green' : 'red' }}>
                                        {isUsernameAvailable ? '사용 가능한 아이디입니다' : '이미 존재하는 아이디입니다'}
                                    </Form.Text>
                                )}
                            </Form.Group>

                            <Form.Group controlId="email" className="mb-3">
                                <Form.Label>이메일</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="이메일을 입력하세요"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group controlId="password" className="mb-3">
                                <Form.Label>비밀번호</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="비밀번호를 입력하세요"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Form.Text>
                                    <div style={{ color: passwordValidations.length ? 'green' : 'red' }}>8자 이상</div>
                                    <div style={{ color: passwordValidations.uppercase ? 'green' : 'red' }}>대문자 하나 이상 포함</div>
                                    <div style={{ color: passwordValidations.lowercase ? 'green' : 'red' }}>소문자 하나 이상 포함</div>
                                    <div style={{ color: passwordValidations.number ? 'green' : 'red' }}>숫자 하나 이상 포함</div>
                                    <div style={{ color: passwordValidations.specialChar ? 'green' : 'red' }}>특수문자 하나 이상 포함 (!@#$%^&*)</div>
                                </Form.Text>
                            </Form.Group>

                            <Form.Group controlId="favoriteFood" className="mb-3">
                                <Form.Label>평소 즐겨 먹는 음식 (선택 사항)</Form.Label>
                                <Form.Select
                                    value={favoriteFood}
                                    onChange={(e) => setFavoriteFood(e.target.value)}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="한식">한식</option>
                                    <option value="중식">중식</option>
                                    <option value="일식">일식</option>
                                    <option value="양식">양식</option>
                                    <option value="기타">기타</option>
                                </Form.Select>
                            </Form.Group>

                            {favoriteFood === '기타' && (
                                <Form.Group controlId="customFood" className="mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="기타 음식 입력"
                                        value={customFood}
                                        onChange={(e) => setCustomFood(e.target.value)}
                                    />
                                </Form.Group>
                            )}

                            <Form.Group controlId="spiceLevel" className="mb-4">
                                <Form.Label>맵기 정도 (선택 사항)</Form.Label>
                                <Form.Select
                                    value={spiceLevel}
                                    onChange={(e) => setSpiceLevel(e.target.value)}
                                >
                                    <option value="">선택하세요</option>
                                    {[1, 2, 3, 4, 5].map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100">회원가입</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default Register;
