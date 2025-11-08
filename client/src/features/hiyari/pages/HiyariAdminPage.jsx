import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Breadcrumb, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HiyariEditModal from '../components/HiyariEditModal'; // ★★★ 編集モーダルをインポート ★★★

function HiyariAdminPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // ★★★ 編集モーダル用の状態管理 ★★★
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHiyari, setEditingHiyari] = useState(null);
  const [exporting, setExporting] = useState(false); // ★★★ CSVエクスポート中の状態管理 ★★★


  useEffect(() => {
    const fetchAdminReports = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/hiyari/admin');
        setReports(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminReports();
  }, []);

  const handleToggleVisibility = async (id) => {
    try {
      const res = await axios.patch(`/api/hiyari/${id}/toggle-visibility`);
      // フロントエンドの状態を即座に更新
      setReports(prevReports =>
        prevReports.map(report =>
          report._id === id ? { ...report, isHidden: res.data.isHidden } : report
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || '表示状態の更新に失敗しました。');
    }
  };

  // ★★★ ここからが新しいロジック ★★★
  const handleEditClick = (report) => {
    setEditingHiyari(report);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingHiyari(null);
  };

  const handleSaveEdit = async (id, updatedData) => {
    try {
      // 管理者用の更新APIを呼び出す
      const res = await axios.put(`/api/hiyari/admin/${id}`, updatedData);
      // 一覧のデータを更新
      setReports(prev => prev.map(item => (item._id === id ? res.data : item)));
      handleCloseEditModal();
    } catch (err) {
      setError('更新に失敗しました。');
    }
  };

  // ★★★ ここからが新しいCSVエクスポート処理 ★★★
  const handleExportCsv = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await axios.get('/api/hiyari/export', {
        responseType: 'blob', // ファイルデータを正しく扱うための設定
      });

      // ファイル名を取得 (バックエンドが設定した名前)
      const contentDisposition = res.headers['content-disposition'];
      let fileName = 'export.csv';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }

      // ダウンロード処理
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('CSVのエクスポートに失敗しました。');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>管理データを読み込んでいます...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/hiyari" }}>ヒヤリ-Navi</Breadcrumb.Item>
            <Breadcrumb.Item active>管理パネル</Breadcrumb.Item>
          </Breadcrumb>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>ヒヤリ-Navi 管理パネル</h1>
            {/* ★★★ CSVエクスポートボタンを追加 ★★★ */}
            <Button variant="outline-success" onClick={handleExportCsv} disabled={exporting}>
              {exporting ? (
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              ) : (
                <i className="bi bi-file-earmark-spreadsheet-fill me-2"></i>
              )}
              {exporting ? 'エクスポート中...' : 'CSVエクスポート'}
            </Button>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>状態</th>
                <th>発生日時</th>
                <th>カテゴリ</th>
                <th>詳細</th>
                <th>投稿者</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report._id} className={report.isHidden ? 'table-secondary' : ''}>
                  <td>
                    {/* ★★★ ここからが修正箇所 ★★★ */}
                    <Badge
                      bg={report.isHidden ? 'secondary' : 'success'}
                      onClick={() => handleToggleVisibility(report._id)}
                      style={{ cursor: 'pointer' }}
                      title="クリックして表示/非表示を切り替え"
                    >
                      {report.isHidden ? '非表示' : '表示中'}
                    </Badge>
                  </td>
                  <td>{new Date(report.incidentDate).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{report.category}</td>
                  <td>{report.description}</td>
                  <td>{report.reportedBy?.username || '不明'}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditClick(report)}
                    >
                      編集
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
      {/* ★★★ 編集モーダルコンポーネントをレンダリング ★★★ */}
      <HiyariEditModal show={showEditModal} onClose={handleCloseEditModal} onSave={handleSaveEdit} hiyari={editingHiyari} />
    </Container>
  );
}

export default HiyariAdminPage;