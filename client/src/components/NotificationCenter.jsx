import React, { useState, useEffect, useCallback } from 'react';
import { Dropdown, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../providers/AuthProvider';

function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get('/api/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('未読通知件数の取得に失敗しました:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // 30秒ごとに未読件数をポーリング
      const intervalId = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user, fetchUnreadCount]);

  const handleToggle = async (isOpen) => {
    // ★ 修正: ドロップダウンが開かれるたびに、常に最新の通知を取得する
    if (isOpen) {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('通知一覧の取得に失敗しました:', err);
        setError('通知の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    // 通知が未読の場合のみ既読化APIを呼び出す
    if (!notification.isRead) {
      try {
        await axios.patch(`/api/notifications/${notification._id}/read`);
        // フロントエンドの状態を即座に更新
        setNotifications(prev =>
          prev.map(n => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('通知の既読化に失敗しました:', err);
      }
    }
    // リンク先に画面遷移
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleReadAll = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('全件既読化に失敗しました:', err);
    }
  };

  if (!user) {
    return null; // ログインしていなければ何も表示しない
  }

  return (
    <Dropdown onToggle={handleToggle} align="end">
      <Dropdown.Toggle variant="outline-light" id="dropdown-notification" className="position-relative border-0">
        <i className="bi bi-bell-fill fs-5"></i>
        {unreadCount > 0 && (
          <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '350px' }}>
        <Dropdown.Header className="d-flex justify-content-between align-items-center">
          <span>通知</span>
          {notifications.length > 0 && unreadCount > 0 && (
             <Button variant="link" size="sm" onClick={handleReadAll}>すべて既読にする</Button>
          )}
        </Dropdown.Header>
        <Dropdown.Divider />
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading && <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>}
          {error && <Alert variant="danger" className="m-2">{error}</Alert>}
          {!loading && notifications.length === 0 && <p className="text-muted text-center p-3">新しい通知はありません。</p>}
          {notifications.map(n => (
            // ★★★ 未読の色を 'bg-light' から 'bg-info-subtle' に変更 ★★★
            <Dropdown.Item as="button" key={n._id} onClick={() => handleNotificationClick(n)} className={n.isRead ? '' : 'bg-info-subtle'}>
              <div className="d-flex">
                <div className="flex-grow-1">
                  <p className="mb-1 small">{n.message}</p>
                  <small className="text-muted">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ja })}
                  </small>
                </div>
                {!n.isRead && <div className="ms-2 mt-1"><Badge bg="primary" style={{ width: '8px', height: '8px' }} pill /></div>}
              </div>
            </Dropdown.Item>
          ))}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default NotificationCenter;
