import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function PostListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/snapsphere/posts');
        setPosts(res.data);
      } catch (err) {
        setError('投稿の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <Container>
      <Row className="my-4 align-items-center">
        <Col>
          <h1>Snap-Sphere</h1>
        </Col>
        <Col xs="auto">
          <Link to="/snapsphere/new" className="btn btn-primary">
            <i className="bi bi-plus-circle-fill me-2"></i>新規投稿
          </Link>
        </Col>
      </Row>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p>読み込み中...</p>
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Row xs={1} md={2} lg={3} className="g-4">
          {posts.map((post) => (
            <Col key={post._id}>
              <Card className="shadow-sm h-100">
                <Card.Img variant="top" src={post.photo.secure_url} style={{ aspectRatio: '4 / 3', objectFit: 'cover' }} />
                <Card.Body>
                  <Card.Title>{post.title}</Card.Title>
                  <Card.Text>{post.description}</Card.Text>
                </Card.Body>
                <Card.Footer>
                  <small className="text-muted">投稿者: {post.postedBy?.username || '不明'}</small>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {!loading && posts.length === 0 && <p className="text-muted">まだ投稿がありません。</p>}
    </Container>
  );
}

export default PostListPage;
