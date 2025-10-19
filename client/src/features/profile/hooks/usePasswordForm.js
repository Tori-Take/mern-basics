import { useState } from 'react';
import axios from 'axios';

/**
 * パスワード変更フォームに関するロジックをカプセル化するカスタムフック
 */
export function usePasswordForm() {
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  const handleChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('新しいパスワードが一致しません。');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await axios.put('/api/users/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('パスワードが正常に更新されました。');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // フォームをクリア
    } catch (err) {
      setError(err.response?.data?.message || 'パスワードの更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return {
    passwordData,
    isSubmitting,
    error,
    success,
    showPassword,
    handleChange,
    handleSubmit,
    toggleShowPassword,
  };
}