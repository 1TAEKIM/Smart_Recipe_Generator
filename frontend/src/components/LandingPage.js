import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../assets/styles/LandingPage.css';

const HeroSection = () => {
    const navigate = useNavigate();

    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

    const handleGetStarted = () => {
        navigate('/main');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="hero-section">
            <div className="content" data-aos="fade-up">
                <h1 style={{ fontSize: '5rem', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '5.5rem', color: '#FF6347' }}>레</span>시피{' '}
                    <span style={{ fontSize: '5.5rem', color: '#FF6347' }}>알</span>려줘?
                </h1>
                <p style={{ fontSize: '1.75rem', marginTop: '1rem' }}>CLOVA X를 활용한 메뉴 추천 서비스</p>
                <button className="cta-button" onClick={handleGetStarted} style={{ fontSize: '1.5rem', padding: '0.75rem 2rem', marginTop: '1.5rem' }}>
                    메인 페이지 <FaArrowRight />
                </button>
            </div>
            <div className="features" data-aos="fade-up" data-aos-delay="200" style={{ marginTop: '3rem' }}>
                <div className="feature-item" onClick={handleLogin} style={{ cursor: 'pointer', fontSize: '1.5rem', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.75rem' }}>🔍 로그인</h3>
                    <p>간편하게 로그인하여 맞춤형 추천을 받아보세요.</p>
                </div>
                <div className="feature-item" onClick={handleRegister} style={{ cursor: 'pointer', fontSize: '1.5rem', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.75rem' }}>🤝 회원가입</h3>
                    <p>새로운 사용자로 가입하여 다양한 혜택을 누리세요.</p>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
