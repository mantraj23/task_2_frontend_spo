import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Link, useParams } from 'react-router-dom';

const fetchWithCache = async (url, expiration = 3600) => {
  const cached = localStorage.getItem(url);
  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    const age = (Date.now() - timestamp) / 1000;
    if (age < expiration) {
      return data;
    }
  }

  try {
    const response = await axios.get(url);
    localStorage.setItem(url, JSON.stringify({ timestamp: Date.now(), data: response.data }));
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

const ListView = () => {
  const [data, setData] = useState(null);
  const [category, setCategory] = useState('people');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchWithCache(`http://localhost:3001/api/${category}?page=${page}`);
      setData(result.results);
      setTotalPages(Math.ceil(result.count / 10)); // Assuming each page contains 10 items
    };

    fetchData();
  }, [category, page]);

  return (
    <div>
      <h1>Star Wars API</h1>
      <label>
        Category:
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="planets">Planets</option>
          <option value="films">Films</option>
          <option value="people">People</option>
          <option value="starships">Starships</option>
          <option value="vehicles">Vehicles</option>
          <option value="species">Species</option>
        </select>
      </label>
      <div>
        {data ? (
          <div>
            <ul>
              {data.map((item, index) => (
                <li key={index}>
                  <Link to={`/${category}/${item.url.split('/').filter(Boolean).pop()}`}>{item.name || item.title}</Link>
                </li>
              ))}
            </ul>
            <div>
              <button onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
              </button>
              <span> Page {page} of {totalPages} </span>
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                Next
              </button>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

const DetailView = () => {
  const { category, id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchWithCache(`http://localhost:3001/api/${category}/${id}`);
      setData(result);
    };

    fetchData();
  }, [category, id]);

  const renderLinks = (value) => {
    if (Array.isArray(value)) {
      return value.map((link) => {
        const parts = link.split('/');
        const entityId = parts.filter(Boolean).pop();
        const entityType = parts[parts.length - 3]; // Get entity type from URL
        return (
          <div key={link}>
            <Link to={`/${entityType}/${entityId}`}>{link}</Link>
          </div>
        );
      });
    } else if (typeof value === 'string' && value.includes('http')) {
      const parts = value.split('/');
      const entityId = parts.filter(Boolean).pop();
      const entityType = parts[parts.length - 3]; // Get entity type from URL
      return <Link to={`/${entityType}/${entityId}`}>{value}</Link>;
    } else {
      return value;
    }
  };

  const renderData = (data) => {
    return Object.keys(data).map((key) => (
      <div key={key}>
        <strong>{key}:</strong> {renderLinks(data[key])}
      </div>
    ));
  };

  return (
    <div>
      <h1>Details</h1>
      {data ? (
        <div>{renderData(data)}</div>
      ) : (
        <p>Loading...</p>
      )}
      <Link to="/">Back to list</Link>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ListView />} />
        <Route path="/:category/:id" element={<DetailView />} />
      </Routes>
    </Router>
  );
};

export default App;
