import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';

function RoleDeleteModal({ show, onClose, onConfirm, role, isDeleting, error }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>ロールの削除</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>
          本当にロール「<strong>{role?.name}</strong>」を削除しますか？
        </p>
        <p className="text-danger">この操作は元に戻すことはできません。</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          キャンセル
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? '削除中...' : '削除する'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RoleDeleteModal;