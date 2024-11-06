import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import MainPage from './components/MainPage';
import RecommendPage from './components/RecommendPage';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
// import VoiceChatPage from './components/VoiceChatPage';
import RecipeDetails from './components/RecipeDetails';
import MyPage from './components/MyPage';
import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 확인 함수
  const checkLoginStatus = async () => {
    try {
      const response = await axios.get(`http://reciperecom.store/main`, { withCredentials: true });
      if (response.status === 200 && response.data.username) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      setIsLoggedIn(false);
      console.error("Error checking login status:", error);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/recipe/:recipe_id" element={<RecipeDetails />} />
          {/* <Route path="/voice-chat" element={<VoiceChatPage />} /> */}

          {/* Protected Routes */}
          <Route
            path="/recommend"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <RecommendPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mypage"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <MyPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
