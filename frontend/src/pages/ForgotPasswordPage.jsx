import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStepOne = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      notifyError('Введите ваш email');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/update/userPasswordStepOne', { email: email.trim() });
      notifySuccess(res.data?.message || 'Код подтверждения отправлен на почту!');
      setStep(2);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Пользователь с таким email не найден');
    } finally {
      setLoading(false);
    }
  };

  const handleStepTwo = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      notifyError('Введите 6-значный код из письма');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/update/userPasswordStepTwo', {
        email: email.trim(),
        code: otpCode.trim(),
      });
      notifySuccess(res.data?.message || 'Код подтверждён!');
      setStep(3);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Неверный код или срок действия истёк');
    } finally {
      setLoading(false);
    }
  };

  const handleStepThree = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      notifyError('Задайте новый пароль');
      return;
    }
    if (newPassword !== repeatPassword) {
      notifyError('Пароли не совпадают!');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/update/userPasswordStepThree', {
        email: email.trim(),
        code: otpCode.trim(),
        newPassword,
      });
      notifySuccess(res.data?.message || 'Пароль успешно обновлён!');
      navigate('/teacher/login');
    } catch (err) {
      notifyError(err.response?.data?.message || 'Ошибка обновления пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 480, margin: '0 0 4px 0' }}>АбитШерпа</h2>
          <span style={{ color: '#c3c3cc', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Восстановление доступа · Шаг {step} из 3
          </span>
        </div>

        <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '36px 32px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
          {step === 1 && (
            <form onSubmit={handleStepOne} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 480, margin: '0 0 6px 0' }}>Сброс пароля или PIN</h1>
                <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>Введите рабочий или учебный email вашей учётной записи.</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Email аккаунта</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@university.ru"
                    required
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#5266eb', color: '#fff', borderRadius: '32px', padding: '12px', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}
              >
                <span>{loading ? 'Отправка...' : 'Отправить 6-значный код'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStepTwo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 480, margin: '0 0 6px 0' }}>Введите код из письма</h2>
                <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>
                  Код отправлен на <strong style={{ color: '#ededf3' }}>{email}</strong>
                </p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>6-значный код</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', fontSize: '18px', letterSpacing: '0.25em', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#5266eb', color: '#fff', borderRadius: '32px', padding: '12px', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>{loading ? 'Проверка...' : 'Подтвердить код'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStepThree} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 480, margin: '0 0 6px 0' }}>Задайте новый пароль</h2>
                <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>Новый пароль или PIN-код будет захеширован и сохранён в базе данных.</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Новый пароль</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Повторите новый пароль</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#5266eb', color: '#fff', borderRadius: '32px', padding: '12px', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}
              >
                <span>{loading ? 'Сохранение...' : 'Обновить пароль и войти'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#c3c3cc', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(112, 112, 125, 0.2)' }}>
            <Link to="/teacher/login" style={{ color: '#ededf3', textDecoration: 'none' }}>
              ← Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}