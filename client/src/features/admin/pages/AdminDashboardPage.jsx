import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';

function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-center my-4">管理者ポータル</h1>
      <p className="text-center text-muted mb-5">各種管理機能にアクセスします。</p>

      <div className="row justify-content-center g-4">
        {/* ユーザー管理カード */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center d-flex flex-column">
              {/* アイコンはBootstrap Iconsを使用 */}
              <i className="bi bi-people-fill fs-1 text-primary mb-3"></i>
              <h5 className="card-title">ユーザー管理</h5>
              <p className="card-text">ユーザーアカウントの表示、ステータス変更、権限の管理を行います。</p>
              <Link to="/admin/users" className="btn btn-primary mt-auto">Manage</Link>
            </div>
          </div>
        </div>

        {/* 役割管理カード (最上位管理者のみ表示) */}
        {user?.isTopLevelAdmin && (
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body text-center d-flex flex-column">
                <i className="bi bi-tags-fill fs-1 text-info mb-3"></i>
                <h5 className="card-title">役割管理</h5>
                <p className="card-text">ユーザーに割り当てる役割（ロール）を動的に作成・編集・削除します。</p>
                <Link to="/admin/roles" className="btn btn-info mt-auto">
                  Manage
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 組織管理カード (ここから追加) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center d-flex flex-column">
              <i className="bi bi-diagram-3-fill fs-1 text-warning mb-3"></i>
              <h5 className="card-title">組織管理</h5>
              <p className="card-text">部署やチームなどの組織階層を管理します。</p>
              <Link to="/admin/tenants" className="btn btn-warning mt-auto">
                Manage
              </Link>
            </div>
          </div>
        </div>

        {/* アプリデータ管理カード (準備中) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center text-muted d-flex flex-column">
              <i className="bi bi-clipboard-data-fill fs-1 mb-3"></i>
              <h5 className="card-title">アプリデータ管理</h5>
              <p className="card-text">TODOデータやその他のアプリケーションデータの統計・管理を行います。</p>
              <button className="btn btn-secondary mt-auto" disabled>準備中</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboardPage;