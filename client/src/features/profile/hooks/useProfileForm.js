import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../providers/AuthProvider';

/**
 * プロフィール情報フォームに関するロジックをカプセル化するカスタムフック
 */
export function useProfileForm() {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({ username: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({ username: user.username, email: user.email });
    }
  }, [user]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await axios.put('/api/users/profile', profileData);
      updateUser(); // AuthContextにユーザー情報の再読み込みをトリガーさせる
      setSuccess('プロフィールが正常に更新されました。');
    } catch (err) {
      setError(err.response?.data?.message || 'プロフィールの更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { profileData, isSubmitting, error, success, handleChange, handleSubmit };
}