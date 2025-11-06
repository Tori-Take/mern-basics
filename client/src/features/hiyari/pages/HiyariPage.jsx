import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, ListGroup, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../../providers/AuthProvider'; // ★ ログインユーザー情報取得のためインポート
import DatePicker from 'react-datepicker';
import { ja } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import HiyariEditModal from '../components/HiyariEditModal'; // ★★★ 正しいパスに修正 ★★★


const INITIAL_STATE = {
  incidentDate: new Date(),
  location: '',
  description: '', // ★ 修正: 'details' から 'description' へ
  category: '転倒・つまずき', // デフォルトカテゴリ
  tags: '',
};

function HiyariPage() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [hiyaris, setHiyaris] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // ★★★ 編集モーダル用の状態管理 ★★★
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHiyari, setEditingHiyari] = useState(null);
  const { user } = useAuth(); // ★ ログインユーザー情報を取得

  // コンポーネントのマウント時にヒヤリハット一覧を取得
  // ★ 修正: useEffectの依存配列からfetchHiyarisを削除
  useEffect(() => {
    fetchHiyaris();
  }, []);

  const fetchHiyaris = async () => {
    try {
      console.log('[FE Hiyari] 1. Fetching hiyari reports from /api/hiyari...');
      setLoading(true);
      const res = await axios.get('/api/hiyari');
      console.log('[FE Hiyari] 2. Successfully fetched data:', res.data);
      setHiyaris(res.data);
      setError('');
    } catch (err) {
      console.error('[FE Hiyari] 2. Failed to fetch data:', err);
      setError('ヒヤリハットの取得に失敗しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, incidentDate: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };
      await axios.post('/api/hiyari', submissionData);
      setFormData(INITIAL_STATE); // フォームをリセット
      fetchHiyaris(); // 一覧を再取得
    } catch (err) {
      setError('投稿に失敗しました。必須項目を確認してください。');
      console.error(err);
    }
  };

  // ★★★ 削除ボタンの処理 ★★★
  const handleDelete = async (id) => {
    if (window.confirm('この投稿を本当に削除しますか？')) {
      try {
        await axios.delete(`/api/hiyari/${id}`);
        // 削除に成功したら、一覧からそのアイテムを削除
        setHiyaris(prev => prev.filter(item => item._id !== id));
      } catch (err) {
        setError('削除に失敗しました。権限がない可能性があります。');
        console.error(err);
      }
    }
  };

  // ★★★ 編集ボタンの処理 ★★★
  const handleEditClick = (hiyari) => {
    setEditingHiyari(hiyari);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingHiyari(null);
  };

  const handleSaveEdit = async (id, updatedData) => {
    try {
      const res = await axios.put(`/api/hiyari/${id}`, updatedData);
      // 一覧のデータを更新
      setHiyaris(prev => prev.map(item => (item._id === id ? res.data : item)));
      handleCloseEditModal(); // モーダルを閉じる
    } catch (err) {
      // モーダル内のエラーとして表示させたいが、一旦ページのエラーとして表示
      setError('更新に失敗しました。権限がない可能性があります。');
      console.error(err);
    }
  };

  // ★★★ 取得したデータを「自分の投稿」と「組織の投稿」に振り分ける ★★★
  const myHiyaris = hiyaris.filter(item => item.reportedBy?._id === user?._id);
  const teamHiyaris = hiyaris.filter(item => item.reportedBy?._id !== user?._id);

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h1>ヒヤリ-Navi</h1>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {/* 入力フォーム */}
        <Col md={4}>
          <Card>
            <Card.Header>新規投稿</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>発生日時</Form.Label>
                  <DatePicker
                    selected={formData.incidentDate}
                    onChange={handleDateChange}
                    className="form-control"
                    dateFormat="yyyy/MM/dd HH:mm"
                    locale={ja}
                    showTimeSelect
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>発生場所</Form.Label>
                  <Form.Control type="text" name="location" value={formData.location} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>カテゴリ</Form.Label>
                  <Form.Select name="category" value={formData.category} onChange={handleChange}>
                    <option>転倒・つまずき</option>
                    <option>衝突</option>
                    <option>誤操作</option>
                    <option>火災・感電</option>
                    <option>その他</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>詳細</Form.Label>
                  <Form.Control as="textarea" rows={4} name="description" value={formData.description} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>タグ (カンマ区切り)</Form.Label>
                  <Form.Control type="text" name="tags" value={formData.tags} onChange={handleChange} />
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" type="submit">投稿する</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* 一覧表示 */}
        <Col md={8}>
          {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <>
              {/* ★★★ 自分の投稿一覧 ★★★ */}
              <h2>あなたの投稿</h2>
              <ListGroup className="mb-4">
                {myHiyaris.length > 0 ? (
                  myHiyaris.map(item => (
                    <ListGroup.Item key={item._id}>
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{item.category}</div>
                        {item.description}
                        <div className="text-muted small mt-2">
                          発生日時: {new Date(item.incidentDate).toLocaleString('ja-JP')} | 
                          投稿者: {item.reportedBy?.username || '不明'}
                        </div>
                      </div>
                      {/* 編集・削除ボタン */}
                      {(user?._id === item.reportedBy?._id || user?.roles.includes('admin')) && (
                        <div className="mt-2 text-end">
                          <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEditClick(item)}>
                            編集
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item._id)}>
                            削除
                          </Button>
                        </div>
                      )}
                    </ListGroup.Item>
                  ))
                ) : (
                  <p className="text-muted">あなたの投稿はまだありません。</p>
                )}
              </ListGroup>

              {/* ★★★ 同じ組織の投稿一覧 ★★★ */}
              <h2>みんなの投稿</h2>
              <ListGroup>
                {teamHiyaris.length > 0 ? (
                  teamHiyaris.map(item => (
                    <ListGroup.Item key={item._id}>
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{item.category}</div>
                        {item.description}
                        <div className="text-muted small mt-2">
                          発生日時: {new Date(item.incidentDate).toLocaleString('ja-JP')} | 
                          投稿者: {item.reportedBy?.username || '不明'}
                        </div>
                      </div>
                      {/* こちらには編集・削除ボタンは表示しない */}
                    </ListGroup.Item>
                  ))
                ) : (
                  <p className="text-muted">組織内の他のメンバーの投稿はまだありません。</p>
                )}
              </ListGroup>
            </>
          )}
        </Col>
      </Row>

      {/* ★★★ 編集モーダルコンポーネントをレンダリング ★★★ */}
      <HiyariEditModal
        show={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        hiyari={editingHiyari}
      />
    </Container>
  );
}

export default HiyariPage;
