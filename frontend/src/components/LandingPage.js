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

    return (
        <div className="hero-section">
            <div className="content" data-aos="fade-up">
                <h1>가지고 있는 재료로 뭐 만들 수 있지?</h1>
                <p>CLOVA X를 활용한 Chat & Voice 메뉴 추천 서비스입니다.</p>
                <button className="cta-button" onClick={handleGetStarted}>
                    메인 페이지 <FaArrowRight />
                </button>
            </div>
            <div className="features" data-aos="fade-up" data-aos-delay="200">
                <div className="feature-item">
                    <h3>🔍 로그인</h3>
                    <p>Explore a curated selection of articles, videos, and resources designed to inspire and empower you.</p>
                </div>
                <div className="feature-item">
                    <h3>🤝 회원가입</h3>
                    <p>Engage with like-minded individuals, share ideas, and grow your network in a supportive environment.</p>
                </div>
                <div className="feature-item">
                    <h3>🚀 체험</h3>
                    <p>Access exclusive tools and features that help you take your skills and creativity to the next level.</p>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
