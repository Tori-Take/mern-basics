import React from 'react';
import { Link } from 'react-router-dom';

function UserDashboardPage() {
  return (
    <div>
      <h1 className="text-center my-4">ダッシュボード</h1>
      <p className="text-center text-muted mb-5">利用したいアプリケーションを選択してください。</p>

      <div className="row justify-content-center g-4">
        {/* TODOアプリカード */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center d-flex flex-column">
              <i className="bi bi-check2-square fs-1 text-success mb-3"></i>
              <h5 className="card-title">TODOアプリ</h5>
              <p className="card-text">日々のタスクを管理し、生産性を向上させましょう。</p>
              <Link to="/todos" className="btn btn-success mt-auto">開く</Link>
            </div>
          </div>
        </div>

        {/* 将来のアプリ用カード (準備中) */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center text-muted d-flex flex-column">
              <i className="bi bi-calendar-event-fill fs-1 mb-3"></i>
              <h5 className="card-title">カレンダー</h5>
              <p className="card-text">予定を管理し、スケジュールを共有します。</p>
              <button className="btn btn-secondary mt-auto" disabled>準備中</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default UserDashboardPage;