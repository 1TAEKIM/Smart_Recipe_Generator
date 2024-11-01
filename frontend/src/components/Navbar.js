import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import '../assets/styles/Navbar.css';

const Navbar = ({ isLoggedIn, handleLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();  // 현재 경로 가져오기

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <header className="header">
            <div className="logo">
                <img src={logo} alt="Logo" />
            </div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded={menuOpen ? "true" : "false"} aria-label="Toggle navigation" onClick={toggleMenu}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
                    <ul className="navbar-nav ml-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/main">Main</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/register">Register</Link>
                        </li>
                        {isLoggedIn && (
                            <li className="nav-item">
                                <button className="nav-link btn" onClick={handleLogout}>Logout</button>
                            </li>
                        )}
                        {/* 로그인 페이지에서는 로그인 버튼을 숨김 */}
                        {!isLoggedIn && location.pathname !== '/login' && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/login">Login</Link>
                            </li>
                        )}
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
