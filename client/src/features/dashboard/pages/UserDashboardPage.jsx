import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { Spinner } from 'react-bootstrap';

function UserDashboardPage() {
  const { user } = useAuth();

  // userオブジェクトがまだ読み込まれていない場合は、ローディング表示をする
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h1>ようこそ、{user.name || user.username}さん</h1>
        <p className="lead text-muted">利用したいアプリケーションを選択してください。</p>
      </div>

      <div className="row justify-content-center g-4">
        {/* --- TODOアプリへのカード --- */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center d-flex flex-column">
              <i className="bi bi-check2-square fs-1 text-success mb-3"></i>
              <h5 className="card-title">TODOアプリ</h5>
              <p className="card-text">日々のタスクを管理します。</p>
              <Link to="/todos" className="btn btn-success mt-auto">
                開く
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default UserDashboardPage;
