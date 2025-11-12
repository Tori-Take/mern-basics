import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Breadcrumb, Form, Button, Card, Spinner, Alert, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker'; // ★★★ DatePickerをインポート ★★★
import { ja } from 'date-fns/locale'; // ★★★ 日本語化のためにインポート ★★★
import 'react-datepicker/dist/react-datepicker.css';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'; // ★★★ useMapをインポート ★★★
import ExifReader from 'exifreader'; // ★★★ exifreaderをインポート ★★★
import 'leaflet/dist/leaflet.css'; // ★★★ 地図ライブラリのCSSをインポート ★★★
import axios from 'axios';

function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('department'); // ★★★ 公開範囲の状態管理を追加 ★★★
  const [shotDate, setShotDate] = useState(new Date()); // ★★★ 撮影日時の状態管理を追加 ★★★
  const [position, setPosition] = useState(null); // ★★★ 地図上の位置情報を管理 ★★★
  const [file, setFile] = useState(null);
  const [locationSource, setLocationSource] = useState('manual'); // 'manual' or 'exif' ★★★ 位置情報のソースを管理 ★★★
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ファイル選択ダイアログをプログラムから開くための参照
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ★★★ 地図クリックイベントを処理するコンポーネント ★★★
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
      },
    });
    return position === null ? null : <Marker position={position}></Marker>;
  }

  // ★★★ ここからが新しいコード ★★★
  // 地図の表示を動的に変更するためのコンポーネント
  function ChangeMapView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.flyTo(center, zoom);
      }
    }, [center, zoom, map]);
    return null;
  }

  const handleFileChange = async (e) => { // ★★★ asyncキーワードを追加 ★★★
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLocationSource('manual'); // ファイルが選択されたら、一旦手動設定に戻す
      setPosition(null); // 位置情報をリセット

      // プレビュー用のURLを生成 (この部分は変更なし)
      setPreview(URL.createObjectURL(selectedFile));

      // ★★★ exifreaderを使ったEXIF情報の読み取り (async/awaitを使用) ★★★
      try {
        const tags = await ExifReader.load(selectedFile);
        
        // GPS情報の取得 (exifreaderは直接十進数の値を返してくれる)
        if (tags.GPSLatitude && tags.GPSLongitude) {
          const lat = tags.GPSLatitude.description;
          const lng = tags.GPSLongitude.description;
          setPosition({ lat, lng });
          setLocationSource('exif');
        }
        
        // 撮影日時の取得
        if (tags.DateTimeOriginal) {
          const dateTimeString = tags.DateTimeOriginal.description;
          const [datePart, timePart] = dateTimeString.split(' ');
          if (datePart && timePart) {
            const formattedDate = datePart.replace(/:/g, '-');
            const dateTime = new Date(`${formattedDate}T${timePart}`);
            if (!isNaN(dateTime)) {
              setShotDate(dateTime);
            }
          }
        }
      } catch (error) {
        // EXIFが読めなくてもエラーにはしない。手動設定にフォールバックする。
      }
    } else {
      // ファイルが選択されなかった場合、プレビューと位置情報をリセット
      setFile(null);
      setPreview('');
      setPosition(null);
      setLocationSource('manual');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('写真とタイトルは必須です。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // --- ステップ1: バックエンドから署名を取得 ---
      const signatureResponse = await axios.post('/api/snapsphere/upload-signature');
      const { signature, timestamp, publicId, cloudName, apiKey } = signatureResponse.data;

      // --- ステップ2: Cloudinaryに直接画像をアップロード ---
      const formData = new FormData();
      // ★★★ ここからが最終修正案 ★★★
      // 署名生成に使ったパラメータと、署名、ファイル本体、そしてAPIキーのみを送信する
      formData.append('api_key', apiKey); // APIキーは署名検証の文脈外で必要
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', publicId); // ★★★ この行を再度追加します ★★★
      formData.append('upload_preset', 'snapsphere_preset'); // ★★★ 作成した専用プリセット名に変更 ★★★
      formData.append('file', file);
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      // ★★★ ここからが修正箇所 ★★★
      // Cloudinaryへのリクエストでは、グローバルに設定されたx-auth-tokenを無効化する
      const cloudinaryResponse = await axios.post(cloudinaryUrl, formData, {
        headers: { 'X-Auth-Token': undefined }
      });

      // --- ステップ3: バックエンドに投稿データを保存 ---
      const postData = {
        title,
        description,
        photo: {
          public_id: cloudinaryResponse.data.public_id,
          secure_url: cloudinaryResponse.data.secure_url,
        },
        visibility, // ★★★ 公開範囲のデータを追加 ★★★
        shotDate, // ★★★ 撮影日時のデータを追加 ★★★
        // ★★★ 位置情報データを追加 ★★★
        location: position ? {
          type: 'Point',
          // 経度、緯度の順で保存
          coordinates: [position.lng, position.lat]
        } : undefined,
      };

      const postResponse = await axios.post('/api/snapsphere/posts', postData);

      // 投稿成功後、一覧ページにリダイレクト
      navigate('/snapsphere');

    } catch (err) {
      // ★★★ エラーオブジェクト全体を詳細に出力 ★★★
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
                      <Image 
                        src={preview} 
                        fluid 
                        rounded 
                        className="mb-3" 
                        style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }} />
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

                {/* ★★★ ここからが新しいコード ★★★ */}
                <Form.Group className="mb-3">
                  <Form.Label>撮影日時</Form.Label>
                  <DatePicker
                    selected={shotDate}
                    onChange={(date) => setShotDate(date)}
                    className="form-control"
                    dateFormat="yyyy/MM/dd HH:mm"
                    locale={ja}
                    showTimeSelect
                    required
                  />
                </Form.Group>

                {/* ★★★ ここからが新しいコード ★★★ */}
                <Form.Group className="mb-3">
                  <Form.Label>公開範囲</Form.Label>
                  <Form.Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                    <option value="private">自分のみ</option>
                    <option value="department">同じ部署のメンバーに公開</option>
                    <option value="tenant">同じ組織のメンバーに公開</option>
                  </Form.Select>
                </Form.Group>

                {/* ★★★ ここからが新しいコード ★★★ */}
                <Form.Group className="mb-3">
                  <Form.Label>撮影場所 (地図をクリックして指定)</Form.Label>
                  {/* positionが設定されていればその位置を、なければ東京駅を中央に */}
                  <MapContainer 
                    center={[35.681236, 139.767125]} // 初期表示位置は固定
                    zoom={13} 
                    style={{ height: '300px', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {/* ★★★ 新しいコンポーネントをここに追加 ★★★ */}
                    <ChangeMapView center={position} zoom={15} />
                    <LocationMarker />
                  </MapContainer>
                  {position && (
                    <Form.Text className="text-muted">
                      {locationSource === 'exif' ? (
                        <><i className="bi bi-info-circle-fill me-1"></i>写真のGPS情報から自動設定されました。変更する場合は地図をクリックしてください。</>
                      ) : (
                        <>緯度: {position.lat.toFixed(6)}, 経度: {position.lng.toFixed(6)}</>
                      )}
                    </Form.Text>
                  )}
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
