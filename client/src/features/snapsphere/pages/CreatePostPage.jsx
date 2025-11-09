import React, { useState, useRef } from 'react';
import { Container, Row, Col, Breadcrumb, Form, Button, Card, Spinner, Alert, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ファイル選択ダイアログをプログラムから開くための参照
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // プレビュー用のURLを生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('写真とタイトルは必須です。');
      return;
    }

    console.log('--- 投稿処理開始 ---');
    setLoading(true);
    setError('');

    try {
      // --- ステップ1: バックエンドから署名を取得 ---
      console.log('ステップ1: 署名取得APIを呼び出し');
      const signatureResponse = await axios.post('/api/snapsphere/upload-signature');
      const { signature, timestamp, publicId, cloudName, apiKey } = signatureResponse.data;
      // ★★★ デバッグ用ログを追加 ★★★
      console.log('[Frontend] ステップ1完了: 署名APIからのレスポンス:', signatureResponse.data);
      console.log('ステップ1完了: 署名取得成功');

      // --- ステップ2: Cloudinaryに直接画像をアップロード ---
      console.log('ステップ2: Cloudinaryへアップロード開始');
      const formData = new FormData();
      // ★★★ ここからが最終修正案 ★★★
      // 署名生成に使ったパラメータと、署名、ファイル本体、そしてAPIキーのみを送信する
      formData.append('api_key', apiKey); // APIキーは署名検証の文脈外で必要
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', publicId);
      formData.append('upload_preset', 'snapsphere_preset'); // ★★★ 作成した専用プリセット名に変更 ★★★
      formData.append('file', file);

      // ★★★ デバッグ用ログを追加: FormDataの中身を全て表示 ★★★
      console.log('[Frontend] Cloudinaryへ送信するFormDataの中身:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      // ★★★ ここからが修正箇所 ★★★
      // Cloudinaryへのリクエストでは、グローバルに設定されたx-auth-tokenを無効化する
      const cloudinaryResponse = await axios.post(cloudinaryUrl, formData, {
        headers: { 'X-Auth-Token': undefined }
      });

      console.log('ステップ2完了: Cloudinaryへのアップロード成功');

      // --- ステップ3: バックエンドに投稿データを保存 ---
      console.log('ステップ3: バックエンドへ投稿データ保存APIを呼び出し');
      const postData = {
        title,
        description,
        photo: {
          public_id: cloudinaryResponse.data.public_id,
          secure_url: cloudinaryResponse.data.secure_url,
        },
        // shotDateとlocationは後のフェーズで実装
      };

      const postResponse = await axios.post('/api/snapsphere/posts', postData);
      console.log('ステップ3完了: バックエンドへの保存成功');

      // 投稿成功後、一覧ページにリダイレクト
      console.log('全ステップ成功。一覧ページへリダイレクトします。');
      navigate('/snapsphere');

    } catch (err) {
      // ★★★ エラーオブジェクト全体を詳細に出力 ★★★
      console.error('投稿処理中にエラーが発生しました:', err);
      if (err.response) {
        console.error('エラーレスポンス:', err.response);
        // ★★★ Cloudinaryからの詳細なエラーメッセージを表示 ★★★
        console.error('[Cloudinary Error]', err.response.data?.error?.message);
      }
      setError(err.response?.data?.message || '投稿に失敗しました。');
    } finally {
      console.log('--- 投稿処理終了 (finallyブロック) ---');
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/snapsphere" }}>Snap-Sphere</Breadcrumb.Item>
            <Breadcrumb.Item active>新規投稿</Breadcrumb.Item>
          </Breadcrumb>
          <Card className="shadow-sm">
            <Card.Header as="h2">新規投稿</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                {/* --- 写真アップロード --- */}
                <Form.Group className="mb-3 text-center">
                  <Form.Label>写真</Form.Label>
                  <Card className="p-3 bg-light" style={{ borderStyle: 'dashed' }}>
                    {preview ? (
                      <Image src={preview} fluid rounded className="mb-3" style={{ maxHeight: '400px' }} />
                    ) : (
                      <div className="text-muted p-5">写真が選択されていません</div>
                    )}
                    <div>
                      <Button variant="outline-secondary" className="me-2" onClick={() => fileInputRef.current.click()}>
                        <i className="bi bi-images me-2"></i>ライブラリから選択
                      </Button>
                      <Button variant="outline-info" onClick={() => cameraInputRef.current.click()}>
                        <i className="bi bi-camera-fill me-2"></i>カメラで撮影
                      </Button>
                    </div>
                  </Card>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                  <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                </Form.Group>

                {/* --- タイトル --- */}
                <Form.Group className="mb-3">
                  <Form.Label>タイトル</Form.Label>
                  <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </Form.Group>

                {/* --- 説明 --- */}
                <Form.Group className="mb-3">
                  <Form.Label>説明</Form.Label>
                  <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : '投稿する'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CreatePostPage;
