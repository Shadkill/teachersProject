import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';
import { useEffect } from 'react';

const banDuration = 5*60*1000;
export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countCode,setCountCode] = useState(3);
  const [now,setNow] = useState(Date.now());
  const [ban,setBan] = useState(()=>{
    const saved = localStorage.getItem('BAN');
    return saved ? Number(saved):0;
  })
  useEffect(()=>{
    const id = setInterval(()=> setNow(Date.now()),1000)
    return ()=>clearInterval(id);
  },[])
  useEffect(()=>{
    if(ban&&ban <=now){
        localStorage.removeItem('BAN');
        setBan(0);
        return;
    }
  },[ban,now]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !pinCode.trim()) {
      notifyError('Заполните учебный email и PIN-код');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/student/login', { email: email.trim(), pinCode: pinCode.trim() });
      notifySuccess(res.data?.message || 'Код подтверждения отправлен на почту!');
      setStep(2);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Неверный email или PIN-код!');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      notifyError('Введите 6-значный код подтверждения');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/student/getToken', { email: email.trim(), code: otpCode.trim() });
      localStorage.setItem('abitsherpa_token', res.data.token);
      notifySuccess('Добро пожаловать в учебный кабинет!');
      navigate('/student/dashboard');
    } catch (err) {
        setCountCode(countCode-1)
        if(countCode<=0){
            localStorage.setItem("BAN",Date.now()+banDuration);
            setBan(localStorage.getItem("BAN"));
            setCountCode(3);
            setStep(1);
            notifyError('Попытки закончились! Получите новый код!');
            return;
        }
      notifyError(err.response?.data?.message || 'Неверный код или срок действия истёк!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 480, margin: '0 0 4px 0' }}>АбитШерпа</h2>
          <span style={{ color: '#c3c3cc', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Учебный кабинет</span>
        </div>

        <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '36px 32px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
          {step === 1 ? (
            <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 480, margin: '0 0 6px 0' }}>Вход для студента</h1>
                <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>Введите учебную почту и персональный пароль.</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Учебный Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.ru"
                    required
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#c3c3cc' }}>Пароль</label>
                  <Link to="/forgot-password" style={{ fontSize: '12px', color: '#c3c3cc', textDecoration: 'none', borderBottom: '1px dotted #70707d' }}>
                    Забыли пароль?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#c3c3cc' }} />
                  <input
                    type="password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="••••"
                    required
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '11px 16px 11px 44px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.2em' }}
                  />
                </div>
              </div>
                {ban>now? <p>Вы пока не можете продолжить авторизацию, продолжить можно через:{Math.ceil((ban - now) / 1000)}сек</p>:<button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#5266eb', color: '#fff', borderRadius: '32px', padding: '12px', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}
              >
                <span>{loading ? 'Отправка...' : 'Получить код'}</span>
                <ArrowRight size={15} />
              </button>}
              

              <div style={{ textAlign: 'center', fontSize: '13px', color: '#c3c3cc', marginTop: '6px' }}>
                Впервые на платформе?{' '}
                <Link to="/student/register" style={{ color: '#ededf3', textDecoration: 'none', borderBottom: '1px solid #70707d' }}>
                  Зарегистрироваться
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 480, margin: '0 0 6px 0' }}>Введите код из письма</h2>
                <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>
                  Код подтверждения отправлен на <strong style={{ color: '#ededf3' }}>{email}</strong>
                </p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>6-значный код</label>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Оставшихся попыток: {countCode}</label>
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
                <span>{loading ? 'Проверка...' : 'Войти в кабинет'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}