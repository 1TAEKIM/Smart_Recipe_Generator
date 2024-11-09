import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const SearchTrend = ({ show, handleClose }) => {
  const [results, setResults] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [gender, setGender] = useState('');
  const [ages, setAges] = useState([]);
  const [error, setError] = useState(null);

  const fetchSearchTrend = async () => {
    try {
      const response = await axios.post('https://reciperecom.store/api/search-trend', {
        keywords,
        gender,
        ages,
      });
      setResults(response.data.results || []);
    } catch (error) {
      console.error('API 요청 오류:', error);
      setError('트렌드 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const renderChart = () => {
    if (results.length === 0) return null;

    const labels = results[0].data.map((item) => item.period);
    const datasets = results.map((result) => ({
      label: result.title,
      data: result.data.map((item) => item.ratio),
      borderColor: '#42A5F5',
      fill: false,
    }));

    const data = {
      labels,
      datasets,
    };

    return <Line data={data} />;
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>검색어 트렌드 조회</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formKeywords">
            <Form.Label>검색어 (쉼표로 구분하여 입력)</Form.Label>
            <Form.Control
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="예: 돼지고기, 돈가스, 김치찌개"
            />
          </Form.Group>
          <Form.Group controlId="formGender" className="mt-3">
            <Form.Label>성별</Form.Label>
            <Form.Control as="select" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">전체</option>
              <option value="m">남성</option>
              <option value="f">여성</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formAges" className="mt-3">
            <Form.Label>연령대</Form.Label>
            <Form.Control
              type="text"
              value={ages}
              onChange={(e) => setAges(e.target.value.split(',').map(age => age.trim()))}
              placeholder="예: 10,20,30"
            />
          </Form.Group>
          <Button variant="primary" onClick={fetchSearchTrend} className="mt-3">
            조회
          </Button>
        </Form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="mt-4">{renderChart()}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          닫기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SearchTrend;
