import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner, Button, Card, Pagination, Navbar, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/images/logo.png';

const categories = ['반찬', '국과찌개', '후식', '일품', '밥', '기타'];

const MainPage = () => {
    const [username, setUsername] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const itemsPerPage = 12;
    const pagesToShow = 6;
    const navigate = useNavigate();

    // 사용자 데이터 가져오기
    const fetchUserData = async () => {
        try {
            const response = await fetch('http://reciperecom.store/api/main', {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            setUsername(data.username || null);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    // 레시피 데이터 가져오기
    const fetchRecipes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://reciperecom.store/api/recipes?page=${currentPage}&limit=${itemsPerPage}&category=${selectedCategory}`);
            const data = await response.json();
            setRecipes(data.recipes.sort(() => 0.5 - Math.random())); // 데이터 셔플링
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Error fetching recipes:', error);
        }
        setIsLoading(false);
    }, [currentPage, selectedCategory]);

    // 페이지 로드 시 사용자 데이터 가져오기
    useEffect(() => {
        fetchUserData();
    }, []);

    // 페이지 번호나 카테고리가 변경될 때만 레시피 데이터를 가져오기
    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    // 로그아웃 기능
    const handleLogout = async () => {
        const response = await fetch('http://reciperecom.store/api/logout', {
            method: 'POST',
            credentials: 'include',
        });
        if (response.status === 200) {
            setUsername(null);
            navigate('/main');
        }
    };

    // 카테고리 변경 처리
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1); // 카테고리를 변경하면 첫 페이지로 이동
    };

    // 페이지 변경 처리
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // Pagination 구성
    const getPaginationItems = () => {
        const items = [];
        const start = Math.floor((currentPage - 1) / pagesToShow) * pagesToShow + 1;
        const end = Math.min(start + pagesToShow - 1, totalPages);
        for (let pageNumber = start; pageNumber <= end; pageNumber++) {
            items.push(
                <Pagination.Item key={pageNumber} active={pageNumber === currentPage} onClick={() => handlePageChange(pageNumber)}>
                    {pageNumber}
                </Pagination.Item>
            );
        }
        return items;
    };

    return (
        <div className="main-container">
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to="/main" onClick={() => window.location.reload()} style={{ height: '100%' }}>
                        <img src={logo} alt="Logo" style={{ height: '40px' }} />
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="navbarNav" />
                    <Navbar.Collapse id="navbarNav" className="justify-content-end text-end">
                        <Navbar.Text className="text-white me-3">
                            {username ? `Hello, ${username}!` : 'Hello, Guest!'}
                        </Navbar.Text>
                        {username ? (
                            <>
                                <Button as={Link} to="/mypage" variant="outline-light" className="me-2">마이 페이지</Button>
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

            <Container className="my-4 text-center">
                <h1 className="mb-4">
                    <span style={{ fontSize: '3rem', color: '#FF6347' }}>레</span>시피{' '}
                    <span style={{ fontSize: '3rem', color: '#FF6347' }}>알</span>려줘?
                </h1>

                <div className="d-flex justify-content-center mb-4">
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                            className="mx-1"
                            onClick={() => handleCategoryChange(category)}
                        >
                            {category}
                        </Button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="text-center my-5">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                ) : (
                    <Row>
                        {recipes.map((recipe) => (
                            <Col key={recipe.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                                <Card as={Link} to={`/recipe/${recipe.id}`} className="h-100 shadow-sm">
                                    <Card.Img variant="top" src={recipe.att_file_no_main} alt={recipe.rcp_nm} />
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="text-center">{recipe.rcp_nm}</Card.Title>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                <Pagination className="justify-content-center mt-4">
                    {currentPage > pagesToShow && (
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} />
                    )}
                    {getPaginationItems()}
                    {currentPage < totalPages && (
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} />
                    )}
                </Pagination>
            </Container>
        </div>
    );
};

export default MainPage;
