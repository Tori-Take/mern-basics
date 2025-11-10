import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../providers/AuthProvider';
import PostEditModal from '../components/PostEditModal'; // パスはこれで正しいはずです

function PostListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // 編集モーダル用の状態管理
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

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

  // ★★★ ここからが新しいロジック ★★★
  const handleDelete = async (postId) => {
    if (window.confirm('この投稿を本当に削除しますか？Cloudinary上の画像も完全に削除されます。')) {
      try {
        await axios.delete(`/api/snapsphere/posts/${postId}`);
        setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
      } catch (err) {
        setError(err.response?.data?.message || '削除に失敗しました。');
      }
    }
  };

  const handleEditClick = (post) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPost(null);
  };

  const handleSaveEdit = async (postId, updatedData) => {
    try {
      const res = await axios.put(`/api/snapsphere/posts/${postId}`, updatedData);
      setPosts(prevPosts =>
        prevPosts.map(p => (p._id === postId ? res.data : p))
      );
      handleCloseEditModal();
    } catch (err) {
      // ここではモーダル内にエラーを表示する代わりに、ページ上部に表示します
      setError(err.response?.data?.message || '更新に失敗しました。');
      // モーダルは閉じないでおく
    }
  };


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
              <Card className="shadow-sm h-100 d-flex flex-column">
                <Link to={`/snapsphere/${post._id}`} className="text-decoration-none text-dark flex-grow-1 d-flex flex-column">
                  <Card.Img variant="top" src={post.photo.secure_url} style={{ aspectRatio: '4 / 3', objectFit: 'cover' }} />
                  <Card.Body className="d-flex flex-column pb-2">
                    <Card.Title>{post.title}</Card.Title>
                    <Card.Text className="flex-grow-1">{post.description}</Card.Text>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <Badge 
                        bg={post.visibility === 'private' ? 'secondary' : post.visibility === 'tenant' ? 'info' : 'primary'}
                      >
                        {post.visibility === 'private' && <><i className="bi bi-lock-fill me-1"></i>自分のみ</>}
                        {post.visibility === 'department' && <><i className="bi bi-people-fill me-1"></i>部署内</>}
                        {post.visibility === 'tenant' && <><i className="bi bi-building me-1"></i>組織内</>}
                      </Badge>
                      {post.location?.coordinates && (
                        <span className="small text-muted">
                          <i className="bi bi-geo-alt-fill me-1"></i>地図情報あり
                        </span>
                      )}
                    </div>
                  </Card.Body>
                </Link>
                <Card.Footer>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted" title={`投稿者: ${post.postedBy?.username || '不明'}`}>
                      {post.tenantId?.name || '不明'}
                    </small>
                    {(user?._id === post.postedBy?._id || user?.roles.includes('admin')) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEditClick(post)}>
                          <i className="bi bi-pencil-fill"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(post._id)}>
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {!loading && posts.length === 0 && <p className="text-muted">まだ投稿がありません。</p>}

      <PostEditModal
        show={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        post={editingPost}
      />
    </Container>
  );
}

export default PostListPage;
