import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/styles/Register.css';  // Register.css 파일 경로
import logo from '../assets/images/logo.png';  // 로고 경로 조정
import { useNavigate } from 'react-router-dom';  // useNavigate 추가

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();  // navigate 선언

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5001/register', {
                username,
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true
            });

            if (response.status === 201) {
                setSuccess('User registered successfully');
                setError('');
                navigate('/login');  // 회원가입 성공 시 메인 페이지로 리다이렉트
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setError(error.response.data.message || 'Registration failed');
                setSuccess('');
            } else {
                setError('Failed to connect to the server');
                setSuccess('');
            }
        }
    };

    return (
        <div className="register-container">
            {/* 상단바 추가 */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <a href="/main" className="navbar-brand">
                        <img src={logo} alt="Logo" height="40" />
                    </a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                <a href="/login" className="nav-link">Login</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Register form */}
            <div className="register-content">
                <h2>Register</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <form onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Register</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
