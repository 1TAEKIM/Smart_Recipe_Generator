import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/images/logo.png';

const RecipeDetails = () => {
    const { recipe_id } = useParams(); // Retrieve recipe_id from URL
    const [recipe, setRecipe] = useState(null);
    const [error, setError] = useState('');
    const [username, setUsername] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch user data to check login status
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://reciperecom.store/api/main', {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await response.json();
                setUsername(data.username || null);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        const fetchRecipeDetails = async () => {
            try {
                const response = await fetch(`http://reciperecom.store/api/recipe/${recipe_id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch recipe details');
                }
                const data = await response.json();
                setRecipe(data);
            } catch (err) {
                console.error("Error fetching recipe details:", err);
                setError(err.message);
            }
        };

        fetchUserData();
        fetchRecipeDetails();
    }, [recipe_id]);

    const handleLogoClick = () => {
        navigate('/main');
        window.location.reload();
    };

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

    if (error) {
        return <div className="text-center mt-5">Error: {error}</div>;
    }

    if (!recipe) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div>
            {/* Navbar */}
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                        <img src={logo} alt="Logo" height="40" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="navbarNav" />
                    <Navbar.Collapse id="navbarNav" className="justify-content-end">
                        {username ? (
                            <>
                                <Navbar.Text className="text-white me-3">
                                    Hello, {username}!
                                </Navbar.Text>
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

            {/* Recipe Details */}
            <Container className="my-4">
                <Row className="justify-content-center">
                    <Col xs={12} md={10} lg={8}>
                        <Card className="shadow-sm">
                            {recipe.main_image && (
                                <Card.Img 
                                    variant="top" 
                                    src={recipe.main_image} 
                                    alt={recipe.name} 
                                    style={{ maxHeight: '300px', objectFit: 'cover' }} 
                                />
                            )}
                            <Card.Body>
                                <Card.Title as="h1" className="text-center">{recipe.name}</Card.Title>
                                <hr />
                                <h3>Ingredients</h3>
                                <p>{recipe.ingredients}</p>

                                <h3>Cooking Tips</h3>
                                <p>{recipe.tip}</p>

                                {recipe.steps && recipe.steps.length > 0 ? (
                                    <div>
                                        <h3>Steps</h3>
                                        {recipe.steps.map((step, index) => (
                                            <Card key={index} className="mb-3">
                                                <Card.Body>
                                                    <h4>Step {step.step}</h4>
                                                    <p>{step.description}</p>
                                                    {step.image && <Card.Img src={step.image} alt={`Step ${step.step}`} />}
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No steps available for this recipe.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default RecipeDetails;
