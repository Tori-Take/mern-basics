import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Breadcrumb, Badge, Button } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../../providers/AuthProvider';
import PostEditModal from '../components/PostEditModal';

function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    let isMounted = true; // クリーンアップ関数用のフラグ
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/snapsphere/posts/${id}`);
        if (isMounted) {
          setPost(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || '投稿の読み込みに失敗しました。');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchPost();

    return () => {
      isMounted = false; // コンポーネントがアンマウントされたらフラグをfalseに
    };
  }, [id]);

  // ★★★ ここからが新しいロジック ★★★
  const handleDelete = async () => {
    if (window.confirm('この投稿を本当に削除しますか？')) {
      try {
        await axios.delete(`/api/snapsphere/posts/${id}`);
        navigate('/snapsphere', { state: { message: '投稿を削除しました。' } });
      } catch (err) {
        setError(err.response?.data?.message || '削除に失敗しました。');
      }
    }
  };

  const handleSaveEdit = async (postId, updatedData) => {
    try {
      const res = await axios.put(`/api/snapsphere/posts/${postId}`, updatedData);
      setPost(res.data); // ページの状態を更新
      setShowEditModal(false); // モーダルを閉じる
    } catch (err) {
      setError(err.response?.data?.message || '更新に失敗しました。');
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
        <p>読み込み中...</p>
      </Container>
    );
  }

  if (error) {
    return <Container><Alert variant="danger" className="mt-4">{error}</Alert></Container>;
  }

  if (!post) {
    return null;
  }

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/snapsphere" }}>Snap-Sphere</Breadcrumb.Item>
            <Breadcrumb.Item active>{post.title}</Breadcrumb.Item>
          </Breadcrumb>

          {/* ★★★ 編集・削除ボタンを追加 ★★★ */}
          {(user?._id === post.postedBy?._id || user?.roles.includes('admin')) && (
            <div className="text-end mb-3">
              <Button variant="outline-secondary" className="me-2" onClick={() => setShowEditModal(true)}>
                <i className="bi bi-pencil-fill me-1"></i>編集
              </Button>
              <Button variant="outline-danger" onClick={handleDelete}>
                <i className="bi bi-trash-fill me-1"></i>削除
              </Button>
            </div>
          )}

          <Card className="shadow-sm">
            <Card.Img variant="top" src={post.photo.secure_url} />
            <Card.Body>
              <Card.Title as="h1">{post.title}</Card.Title>
              <Card.Text>{post.description}</Card.Text>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <Badge bg={post.visibility === 'private' ? 'secondary' : post.visibility === 'tenant' ? 'info' : 'primary'}>
                  {post.visibility === 'private' && <><i className="bi bi-lock-fill me-1"></i>自分のみ</>}
                  {post.visibility === 'department' && <><i className="bi bi-people-fill me-1"></i>部署内</>}
                  {post.visibility === 'tenant' && <><i className="bi bi-building me-1"></i>組織内</>}
                </Badge>
                {post.location?.coordinates && (
                  <a href={`https://www.google.com/maps?q=${post.location.coordinates[1]},${post.location.coordinates[0]}`} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-geo-alt-fill me-1"></i>地図で見る
                  </a>
                )}
              </div>
            </Card.Body>
            <Card.Footer className="text-muted">
              部署: {post.tenantId?.name || '不明'} | 投稿者: {post.postedBy?.username || '不明'} | 投稿日時: {new Date(post.createdAt).toLocaleString('ja-JP')}
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <PostEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        post={post}
      />
    </Container>
  );
}

export default PostDetailPage;
