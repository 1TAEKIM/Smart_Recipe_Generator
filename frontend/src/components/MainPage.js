import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/images/logo.png'; // 로고 이미지 경로

const MainPage = () => {
    const [username, setUsername] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
    const itemsPerPage = 12; // 한 페이지당 12개의 레시피 표시
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
        fetchRecipes();
    }, [currentPage]);

    const fetchUserData = async () => {
        try {
            const response = await fetch('http://localhost:5001/main', {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            if (data.username) {
                setUsername(data.username);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchRecipes = async () => {
        setIsLoading(true); // 데이터 가져오기 시작할 때 로딩 상태 활성화
        try {
            const response = await fetch(`http://localhost:5001/api/recipes?page=${currentPage}&limit=${itemsPerPage}`);
            const data = await response.json();
            const shuffledRecipes = data.recipes.sort(() => 0.5 - Math.random()); // 레시피 데이터를 무작위로 섞음
            setRecipes(shuffledRecipes);  // 무작위로 섞인 데이터를 상태에 설정
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Error fetching recipes:', error);
        }
        setIsLoading(false); // 데이터 가져오기가 끝나면 로딩 상태 비활성화
    };
    

    const handleLogout = async () => {
        const response = await fetch('http://localhost:5001/logout', {
            method: 'POST',
            credentials: 'include',
        });
        if (response.status === 200) {
            setUsername(null);
            navigate('/main');
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="main-container">
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <Link to="/main" className="navbar-brand">
                        <img src={logo} alt="Logo" height="40" />
                    </Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            {username ? (
                                <>
                                    <li className="nav-item">
                                        <span className="nav-link">Hello, {username}!</span>
                                    </li>
                                    {/* '메뉴 추천' 버튼, 로그인한 경우에만 표시 */}
                                    <li className="nav-item">
                                        <Link to="/recommend" className="nav-link">메뉴 추천</Link>
                                    </li>
                                    <li className="nav-item">
                                        <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="nav-item">
                                        <Link to="/login" className="nav-link">Login</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link to="/register" className="nav-link">Register</Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>

            <div className="main-content text-center mt-5">
                <h1>Welcome to the Main Page</h1>
                {username ? <h2>Hello, {username}!</h2> : <h2>Hello, Guest!</h2>}

                {/* 로딩 상태를 체크하고, 로딩 중이면 스피너 표시 */}
                {isLoading ? (
                    <div className="spinner-border" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                ) : (
                    <div className="container">
                        <div className="row">
                            {recipes.map((recipe, index) => (
                                <div key={index} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                                    <div className="card">
                                        <img src={recipe.att_file_no_main} alt={recipe.rcp_nm} className="card-img-top" />
                                        <div className="card-body">
                                            <h5 className="card-title">{recipe.rcp_nm}</h5>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                <nav>
                    <ul className="pagination justify-content-center">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                                    {i + 1}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default MainPage;
