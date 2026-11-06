import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';

export default function TeacherRegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !inviteCode.trim() || !password) {
      notifyError('Заполните все обязательные поля');
      return;
    }
    if (password !== repeatPassword) {
      notifyError('Пароли не совпадают!');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/teacher/registration', {
        fullName: fullName.trim(),
        email: email.trim(),
        code: inviteCode.trim(),
        password,
        repeatPassword,
      });
      notifySuccess(res.data?.message || 'Регистрация прошла успешно! Теперь выполните вход.');
      navigate('/teacher/login');
    } catch (err) {
      notifyError(err.response?.data?.message || 'Ошибка регистрации преподавателя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '460px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 480, margin: '0 0 4px 0' }}>АбитШерпа</h2>
          <span style={{ color: '#c3c3cc', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Регистрация преподавателя
          </span>
        </div>
        <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '36px 32px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 480, margin: '0 0 6px 0' }}>Создать профиль преподавателя</h1>
              <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>
                Для регистрации требуется персональный код приглашения, выданный администрацией.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>ФИО преподавателя</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Смирнов Алексей Иванович"
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Рабочий Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@university.ru"
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Код приглашения</label>
              <div style={{ position: 'relative' }}>
                <KeyRound style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="INVITE-2026-MATH"
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.05em' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 44px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Повторите пароль</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#5266eb', color: '#fff', borderRadius: '32px', padding: '12px', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}
            >
              <span>{loading ? 'Создание профиля...' : 'Зарегистрироваться'}</span>
              <ArrowRight size={15} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '13px', color: '#c3c3cc', marginTop: '8px' }}>
              Уже зарегистрированы?{' '}
              <Link to="/teacher/login" style={{ color: '#ededf3', textDecoration: 'none', borderBottom: '1px solid #70707d' }}>
                Войти в кабинет
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}