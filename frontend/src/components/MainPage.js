import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner, Button, Card, Pagination, Navbar, Container, Row, Col, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/images/logo.png';

const mainCategories = [
    { name: '전체', value: '' },
    { name: '한식', value: 'Korean' },
    { name: '중식', value: 'Chinese' },
    { name: '양식', value: 'Western' }
];

const subCategories = {
    Korean: ['반찬', '국과찌개', '후식', '일품', '밥', '기타'],
    Chinese: ['튀김', '면류', '전골', '기타'],
    Western: ['샐러드', '스프', '메인', '디저트', '기타']
};

const MainPage = () => {
    const [username, setUsername] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const itemsPerPage = 12;
    const pagesToShow = 6;
    const navigate = useNavigate();

    const fetchUserData = async () => {
        try {
            const response = await fetch('https://reciperecom.store/api/main', {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            setUsername(data.username || null);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchRecipes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://reciperecom.store/api/recipes?page=${currentPage}&limit=${itemsPerPage}&category=${selectedMainCategory}&subCategory=${selectedSubCategory}`);
            const data = await response.json();
            setRecipes(data.recipes);
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Error fetching recipes:', error);
        }
        setIsLoading(false);
    }, [currentPage, selectedMainCategory, selectedSubCategory]);

    useEffect(() => {
        fetchUserData();
        fetchRecipes();
    }, [fetchRecipes]);

    const handleLogout = async () => {
        const response = await fetch('https://reciperecom.store/api/logout', {
            method: 'POST',
            credentials: 'include',
        });
        if (response.status === 200) {
            setUsername(null);
            navigate('/main');
        }
    };

    const handleMainCategoryChange = (category) => {
        setSelectedMainCategory(category);
        setSelectedSubCategory(''); // Reset subcategory when main category changes
        setCurrentPage(1);
    };

    const handleSubCategoryChange = (subCategory) => {
        setSelectedSubCategory(subCategory);
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

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
                                <Button as={Link} to="/recommend" variant="outline-light" className="me-2">AI 메뉴 추천</Button>
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

            <Container className="d-flex justify-content-center my-3">
                <ButtonGroup aria-label="Main categories">
                    {mainCategories.map((mainCategory) => (
                        <Button
                            key={mainCategory.value}
                            variant={selectedMainCategory === mainCategory.value ? 'primary' : 'outline-primary'}
                            className="mx-1 px-4"
                            onClick={() => handleMainCategoryChange(mainCategory.value)}
                            style={{
                                fontWeight: selectedMainCategory === mainCategory.value ? 'bold' : 'normal',
                                borderRadius: '20px',
                                transition: '0.3s',
                            }}
                        >
                            {mainCategory.name}
                        </Button>
                    ))}
                </ButtonGroup>
            </Container>

            <Container className="my-4 text-center">
                <h1 className="mb-4">
                    <span style={{ fontSize: '3rem', color: '#FF6347' }}>레</span>시피{' '}
                    <span style={{ fontSize: '3rem', color: '#FF6347' }}>알</span>려줘?
                </h1>

                {selectedMainCategory && (
                    <div className="d-flex justify-content-center mb-4">
                        {(subCategories[selectedMainCategory] || []).map((subCategory) => (
                            <Button
                                key={subCategory}
                                variant={selectedSubCategory === subCategory ? 'primary' : 'outline-primary'}
                                className="mx-1"
                                onClick={() => handleSubCategoryChange(subCategory)}
                                style={{
                                    fontWeight: selectedSubCategory === subCategory ? 'bold' : 'normal',
                                    transition: '0.3s',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '15px'
                                }}
                            >
                                {subCategory}
                            </Button>
                        ))}
                    </div>
                )}

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
