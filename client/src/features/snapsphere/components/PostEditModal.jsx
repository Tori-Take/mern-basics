import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

function PostEditModal({ show, onClose, onSave, post }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        description: post.description || '',
        visibility: post.visibility || 'department',
      });
      setError('');
    }
  }, [post]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('タイトルは必須項目です。');
      return;
    }
    onSave(post._id, formData);
  };

  if (!show) {
    return null;
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>投稿を編集</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>タイトル</Form.Label>
            <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>説明</Form.Label>
            <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>公開範囲</Form.Label>
            <Form.Select name="visibility" value={formData.visibility} onChange={handleChange}>
              <option value="private">自分のみ</option>
              <option value="department">同じ部署のメンバーに公開</option>
              <option value="tenant">同じ組織のメンバーに公開</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" type="submit">更新する</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default PostEditModal;