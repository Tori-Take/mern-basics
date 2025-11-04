import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { ja } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

function HiyariEditModal({ show, onClose, onSave, hiyari }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  // モーダルに表示するデータが変更されたときにフォームを初期化
  useEffect(() => {
    if (hiyari) {
      setFormData({
        incidentDate: hiyari.incidentDate ? new Date(hiyari.incidentDate) : new Date(),
        location: hiyari.location || '',
        details: hiyari.details || '',
        category: hiyari.category || '転倒・つまずき',
        tags: (hiyari.tags || []).join(', '), // 配列をカンマ区切りの文字列に変換
      });
      setError(''); // エラーをリセット
    }
  }, [hiyari]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, incidentDate: date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.details.trim()) {
      setError('詳細は必須項目です。');
      return;
    }
    const submissionData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    onSave(hiyari._id, submissionData);
  };

  if (!show) {
    return null;
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>ヒヤリハットを編集</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
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
            <Form.Control as="textarea" rows={4} name="details" value={formData.details} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>タグ (カンマ区切り)</Form.Label>
            <Form.Control type="text" name="tags" value={formData.tags} onChange={handleChange} />
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

export default HiyariEditModal;