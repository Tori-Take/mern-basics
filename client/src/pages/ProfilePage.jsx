import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useProfileForm } from '../hooks/useProfileForm';
import { usePasswordForm } from '../hooks/usePasswordForm';
import { Form, Button, Card, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap';

function ProfilePage() {
  const { user } = useAuth();
  const {
    profileData,
    isSubmitting: isSubmittingProfile,
    error: profileError,
    success: profileSuccess,
    handleChange: handleProfileChange,
    handleSubmit: handleProfileSubmit,
  } = useProfileForm();

  const {
    passwordData,
    isSubmitting: isSubmittingPassword,
    error: passwordError,
    success: passwordSuccess,
    showPassword,
    handleChange: handlePasswordChange,
    handleSubmit: handlePasswordSubmit,
    toggleShowPassword,
  } = usePasswordForm();

  if (!user) {
    return <div className="text-center"><Spinner animation="border" /></div>;
  }

  return (
    <Row className="justify-content-center">
      <Col lg={8}>
        <h1 className="text-center mb-4">プロフィール</h1>
        {(profileError || passwordError) && <Alert variant="danger">{profileError || passwordError}</Alert>}
        {(profileSuccess || passwordSuccess) && <Alert variant="success">{profileSuccess || passwordSuccess}</Alert>}

        <Card className="shadow-sm mb-4">
          <Card.Header as="h5">基本情報</Card.Header>
          <Card.Body>
            <Form onSubmit={handleProfileSubmit}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>所属部署</Form.Label>
                <Col sm={9}>
                  <Form.Control type="text" readOnly defaultValue={user.tenantId?.name || 'N/A'} />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>ユーザー名</Form.Label>
                <Col sm={9}>
                  <Form.Control type="text" readOnly defaultValue={profileData.username} />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>メールアドレス</Form.Label>
                <Col sm={9}>
                  <Form.Control type="email" name="email" value={profileData.email} onChange={handleProfileChange} required />
                </Col>
              </Form.Group>
              <div className="text-end">
                <Button type="submit" variant="primary" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? <Spinner as="span" size="sm" /> : null} 更新
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header as="h5">パスワード変更</Card.Header>
          <Card.Body>
            <Form onSubmit={handlePasswordSubmit}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>現在のパスワード</Form.Label>
                <Col sm={9}>
                  <InputGroup>
                    <Form.Control type={showPassword.current ? 'text' : 'password'} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
                    <Button variant="outline-secondary" onClick={() => toggleShowPassword('current')}>
                      {showPassword.current ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                    </Button>
                  </InputGroup>
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>新しいパスワード</Form.Label>
                <Col sm={9}>
                  <InputGroup>
                    <Form.Control type={showPassword.new ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required minLength="6" />
                    <Button variant="outline-secondary" onClick={() => toggleShowPassword('new')}>
                      {showPassword.new ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                    </Button>
                  </InputGroup>
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>新しいパスワード (確認)</Form.Label>
                <Col sm={9}>
                  <InputGroup>
                    <Form.Control type={showPassword.confirm ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required />
                    <Button variant="outline-secondary" onClick={() => toggleShowPassword('confirm')}>
                      {showPassword.confirm ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                    </Button>
                  </InputGroup>
                </Col>
              </Form.Group>
              <div className="text-end">
                <Button type="submit" variant="warning" disabled={isSubmittingPassword}>
                  {isSubmittingPassword ? <Spinner as="span" size="sm" /> : null} パスワードを更新
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default ProfilePage;