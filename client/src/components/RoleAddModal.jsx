import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';

function RoleAddModal({ show, onClose, onRoleAdded }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modalが閉じられたときにStateをリセットする
  useEffect(() => {
    if (!show) {
      setName('');
      setDescription('');
      setError('');
      setIsSubmitting(false);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/roles', { name, description });
      onRoleAdded(res.data); // 親コンポーネントに新しいロールを渡す
    } catch (err) {
      setError(err.response?.data?.message || 'ロールの作成に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>新規ロール追加</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form.Group className="mb-3" controlId="roleName">
            <Form.Label>ロール名 <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="roleDescription">
            <Form.Label>説明</Form.Label>
            <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? '作成中...' : '作成'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default RoleAddModal;
