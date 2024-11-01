import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/styles/Login.css';  // Adjust the path to your CSS file
import logo from '../assets/images/logo.png';  // Adjust the path according to your folder structure

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
                setError(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }
    };

    return (
        <div className="login-container">
            {/* Navbar component */}
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
                                <a href="/register" className="nav-link">Register</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Login form */}
            <div className="login-content">
                <h2>Login</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
