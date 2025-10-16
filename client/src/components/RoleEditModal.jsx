import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';

function RoleEditModal({ show, onClose, onRoleUpdated, role }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // モーダルに表示するロール情報が変更されたら、フォームの値を更新する
  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
    }
    // モーダルが非表示になるときにエラーをクリア
    if (!show) {
      setError('');
    }
  }, [role, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return;

    setError('');
    setIsSubmitting(true);

    try {
      const res = await axios.put(`/api/roles/${role._id}`, { name, description });
      onRoleUpdated(res.data); // 親コンポーネントに更新後のロールを渡す
    } catch (err) {
      setError(err.response?.data?.message || 'ロールの更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>ロール編集</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form.Group className="mb-3" controlId="editRoleName">
            <Form.Label>ロール名 <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="editRoleDescription">
            <Form.Label>説明</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? '更新中...' : '更新'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default RoleEditModal;