import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const BAN_STORAGE_KEY = 'abitsherpa_admin_ban_until';
const BAN_DURATION_MS = 30 * 60 * 1000; // 30 минут

export default function AdminLoginPage() {
  const navigate = useNavigate();

  // Шаги контура безопасности:
  // 'gate' - ввод мастер-ключа доступа к форме
  // 'credentials' - ввод email и пароля администратора
  // 'otp' - ввод 6-значного кода с почты
  const [stage, setStage] = useState('gate');

  // Счётчики оставшихся попыток (по 2 попытки на каждый этап)
  const [gateAttemptsLeft, setGateAttemptsLeft] = useState(2);
  const [credAttemptsLeft, setCredAttemptsLeft] = useState(2);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(2);

  // Состояние временной блокировки на 30 минут
  const [isBanned, setIsBanned] = useState(false);
  const [banRemainingSec, setBanRemainingSec] = useState(0);

  // Поля ввода
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showMasterKey, setShowMasterKey] = useState(false);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);

  // Проверка активного бана в localStorage при монтировании и отсчёт таймера
  useEffect(() => {
    const checkBanStatus = () => {
      const storedBanUntil = localStorage.getItem(BAN_STORAGE_KEY);
      if (!storedBanUntil) {
        setIsBanned(false);
        return;
      }
      const banUntilMs = Number(storedBanUntil);
      const now = Date.now();

      if (now < banUntilMs) {
        setIsBanned(true);
        setBanRemainingSec(Math.ceil((banUntilMs - now) / 1000));
      } else {
        // Срок бана истёк — сбрасываем состояние
        localStorage.removeItem(BAN_STORAGE_KEY);
        setIsBanned(false);
        setBanRemainingSec(0);
        setGateAttemptsLeft(2);
        setCredAttemptsLeft(2);
        setOtpAttemptsLeft(2);
        setStage('gate');
      }
    };

    checkBanStatus();
    const interval = setInterval(checkBanStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Функция включения 30-минутного бана
  const trigger30MinBan = (reason) => {
    const banUntil = Date.now() + BAN_DURATION_MS;
    localStorage.setItem(BAN_STORAGE_KEY, String(banUntil));
    setIsBanned(true);
    setBanRemainingSec(30 * 60);
    toast.error(`Превышен лимит попыток (${reason})! Доступ заблокирован на 30 минут.`, {
      duration: 5000
    });
  };

  // 1. Проверка мастер-пароля шлюза (Контур 0)
  const handleVerifyMasterGate = async (e) => {
    e.preventDefault();
    if (isBanned) return;

    if (!masterKeyInput.trim()) {
      toast.error('Введите мастер-ключ доступа');
      return;
    }

    setLoading(true);
    try {
      // Запрос на сервер для проверки мастер-ключа шлюза администратора
      const res = await axios.post(`${API_BASE}/admin/verifyMasterGate`, {
        masterKey: masterKeyInput.trim()
      });

      toast.success(res.data?.message || 'Доступ к авторизации открыт!');
      setStage('credentials');
      setMasterKeyInput('');
    } catch (err) {
      const nextLeft = gateAttemptsLeft - 1;
      setGateAttemptsLeft(nextLeft);

      if (nextLeft <= 0) {
        trigger30MinBan('Неверный мастер-ключ доступа');
      } else {
        toast.error(`Неверный мастер-ключ! Осталась ${nextLeft} попытка до блокировки на 30 минут.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Вход по Email и Паролю администратора (Контур 1)
  const handleAdminCredentialsLogin = async (e) => {
    e.preventDefault();
    if (isBanned) return;

    if (!adminEmail.trim() || !adminPassword) {
      toast.error('Заполните email и пароль');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/login`, {
        email: adminEmail.trim(),
        password: adminPassword
      });

      toast.success(res.data?.message || 'Одноразовый код отправлен на почту');
      setStage('otp');
    } catch (err) {
      const nextLeft = credAttemptsLeft - 1;
      setCredAttemptsLeft(nextLeft);

      if (nextLeft <= 0) {
        trigger30MinBan('Неверные учётные данные администратора');
      } else {
        toast.error(`Неверный логин или пароль! Осталась ${nextLeft} попытка до блокировки.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Подтверждение 6-значного OTP-кода из почты (Контур 2)
  const handleVerifyAdminOtp = async (e) => {
    e.preventDefault();
    if (isBanned) return;

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      toast.error('Код подтверждения должен состоять из 6 цифр');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/verifyCode`, {
        email: adminEmail.trim(),
        code: cleanCode
      });

      const token = res.data?.token;
      if (token) {
        localStorage.setItem('abitsherpa_admin_token', token);
      }

      toast.success(res.data?.message || 'Авторизация администратора подтверждена!');
      // Очищаем попытки и переходим в панель управления
      setGateAttemptsLeft(2);
      setCredAttemptsLeft(2);
      setOtpAttemptsLeft(2);
      navigate('/admin/dashboard');
    } catch (err) {
      const nextLeft = otpAttemptsLeft - 1;
      setOtpAttemptsLeft(nextLeft);

      if (nextLeft <= 0) {
        trigger30MinBan('Неверный код подтверждения из письма');
      } else {
        toast.error(`Неверный код из письма! Осталась ${nextLeft} попытка до блокировки.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Форматирование секунд в ММ:СС
  const formatBanTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        backgroundColor: '#171721',
        color: '#ededf3',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Логотип и статус контура */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1e1e2a',
              border: '1px solid rgba(112, 112, 125, 0.3)',
              borderRadius: '32px',
              padding: '6px 14px',
              marginBottom: '12px'
            }}
          >
            <ShieldAlert size={14} color="#e5484d" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c3c3cc' }}>
              Закрытый контур управления
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 4px 0' }}>АбитШерпа · Администратор</h2>
          <span style={{ color: '#c3c3cc', fontSize: '12px' }}>
            Многоуровневая верификация прав суперпользователя
          </span>
        </div>

        {/* ================================================================
            ЭКРАН БЛОКИРОВКИ НА 30 МИНУТ ПРИ ИСЧЕРПАНИИ ПОПЫТОК
        ================================================================ */}
        {isBanned ? (
          <div
            style={{
              backgroundColor: '#1e1e2a',
              borderRadius: '12px',
              padding: '40px 32px',
              border: '1px solid rgba(229, 72, 77, 0.45)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(229, 72, 77, 0.15)',
                color: '#e5484d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto'
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 8px 0', color: '#ededf3' }}>
              Доступ временно заблокирован
            </h1>
            <p style={{ fontSize: '13px', color: '#c3c3cc', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Превышено максимально допустимое количество попыток ввода (2 из 2). В целях безопасности шлюз авторизации заблокирован.
            </p>

            <div
              style={{
                backgroundColor: '#272735',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(112, 112, 125, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '24px'
              }}
            >
              <Clock size={18} color="#e5484d" />
              <span style={{ fontSize: '13px', color: '#c3c3cc' }}>Осталось ждать:</span>
              <span style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'monospace', color: '#ededf3' }}>
                {formatBanTimer(banRemainingSec)}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#70707d', lineHeight: 1.4 }}>
              Повторная попытка будет доступна автоматически после обнуления таймера.
            </div>
          </div>
        ) : (
          /* ================================================================
              ОСНОВНАЯ КАРТОЧКА АВТОРИЗАЦИИ (3 КОНТУРА)
          ================================================================ */
          <div
            style={{
              backgroundColor: '#1e1e2a',
              borderRadius: '12px',
              padding: '36px 32px',
              border: '1px solid rgba(112, 112, 125, 0.25)'
            }}
          >
            {/* ------------------------------------------------------------
                ЭТАП 1: ВВОД МАСТЕР-КЛЮЧА ДОСТУПА К ШЛЮЗУ (GATE)
            ------------------------------------------------------------ */}
            {stage === 'gate' && (
              <form onSubmit={handleVerifyMasterGate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5266eb', letterSpacing: '0.04em', fontWeight: 500 }}>
                      Уровень 1 · Защитный шлюз
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        backgroundColor: gateAttemptsLeft === 1 ? 'rgba(229, 72, 77, 0.2)' : '#272735',
                        color: gateAttemptsLeft === 1 ? '#fca5a5' : '#c3c3cc',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        border: gateAttemptsLeft === 1 ? '1px solid rgba(229, 72, 77, 0.4)' : '1px solid #70707d'
                      }}
                    >
                      Попыток: {gateAttemptsLeft} из 2
                    </span>
                  </div>
                  <h1 style={{ fontSize: '21px', fontWeight: 500, margin: '0 0 6px 0' }}>Мастер-пароль доступа</h1>
                  <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>
                    Для разблокировки формы входа введите секретный мастер-ключ администрирования.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>
                    Секретный ключ шлюза
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#c3c3cc' }}
                    />
                    <input
                      type={showMasterKey ? 'text' : 'password'}
                      value={masterKeyInput}
                      onChange={(e) => setMasterKeyInput(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        backgroundColor: '#272735',
                        border: '1px solid #70707d',
                        borderRadius: '32px',
                        color: '#ededf3',
                        padding: '11px 44px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterKey(!showMasterKey)}
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer', padding: 0 }}
                    >
                      {showMasterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#5266eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '32px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px'
                  }}
                >
                  <span>{loading ? 'Проверка ключа...' : 'Открыть доступ к авторизации'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* ------------------------------------------------------------
                ЭТАП 2: ВВОД EMAIL И ПАРОЛЯ АДМИНИСТРАТОРА (CREDENTIALS)
            ------------------------------------------------------------ */}
            {stage === 'credentials' && (
              <form onSubmit={handleAdminCredentialsLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5266eb', letterSpacing: '0.04em', fontWeight: 500 }}>
                      Уровень 2 · Учётная запись
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        backgroundColor: credAttemptsLeft === 1 ? 'rgba(229, 72, 77, 0.2)' : '#272735',
                        color: credAttemptsLeft === 1 ? '#fca5a5' : '#c3c3cc',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        border: credAttemptsLeft === 1 ? '1px solid rgba(229, 72, 77, 0.4)' : '1px solid #70707d'
                      }}
                    >
                      Попыток: {credAttemptsLeft} из 2
                    </span>
                  </div>
                  <h1 style={{ fontSize: '21px', fontWeight: 500, margin: '0 0 6px 0' }}>Авторизация администратора</h1>
                  <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>
                    Введите персональный логин и пароль учётной записи с правами администратора.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>
                    Служебный Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#c3c3cc' }}
                    />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@abitsherpa.ru"
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        backgroundColor: '#272735',
                        border: '1px solid #70707d',
                        borderRadius: '32px',
                        color: '#ededf3',
                        padding: '11px 16px 11px 44px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>
                    Пароль администратора
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#c3c3cc' }}
                    />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#272735',
                        border: '1px solid #70707d',
                        borderRadius: '32px',
                        color: '#ededf3',
                        padding: '11px 44px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer', padding: 0 }}
                    >
                      {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#5266eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '32px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px'
                  }}
                >
                  <span>{loading ? 'Проверка данных...' : 'Выслать одноразовый код'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* ------------------------------------------------------------
                ЭТАП 3: ПОДТВЕРЖДЕНИЕ 6-ЗНАЧНОГО КОДА ИЗ ПОЧТЫ (OTP)
            ------------------------------------------------------------ */}
            {stage === 'otp' && (
              <form onSubmit={handleVerifyAdminOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5266eb', letterSpacing: '0.04em', fontWeight: 500 }}>
                      Уровень 3 · Двухфакторное подтверждение
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        backgroundColor: otpAttemptsLeft === 1 ? 'rgba(229, 72, 77, 0.2)' : '#272735',
                        color: otpAttemptsLeft === 1 ? '#fca5a5' : '#c3c3cc',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        border: otpAttemptsLeft === 1 ? '1px solid rgba(229, 72, 77, 0.4)' : '1px solid #70707d'
                      }}
                    >
                      Попыток: {otpAttemptsLeft} из 2
                    </span>
                  </div>
                  <h1 style={{ fontSize: '21px', fontWeight: 500, margin: '0 0 6px 0' }}>Введите код из письма</h1>
                  <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>
                    На почту <strong style={{ color: '#ededf3' }}>{adminEmail}</strong> отправлен 6-значный ключ подтверждения.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>
                    Одноразовый 6-значный код
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="849201"
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      backgroundColor: '#272735',
                      border: '1px solid #70707d',
                      borderRadius: '32px',
                      color: '#ededf3',
                      padding: '12px 18px',
                      fontSize: '20px',
                      letterSpacing: '0.3em',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  style={{
                    backgroundColor: '#5266eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '32px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    opacity: otpCode.length === 6 ? 1 : 0.6
                  }}
                >
                  <span>{loading ? 'Аутентификация...' : 'Войти в панель администратора'}</span>
                  <ShieldCheck size={16} />
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', paddingTop: '8px', borderTop: '1px solid rgba(112, 112, 125, 0.2)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStage('credentials');
                      setOtpCode('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer', padding: 0 }}
                  >
                    ← Изменить данные
                  </button>
                  <span style={{ color: '#70707d' }}>Код действителен 10 мин.</span>
                </div>
              </form>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" style={{ color: '#c3c3cc', fontSize: '13px', textDecoration: 'none', borderBottom: '1px solid #70707d' }}>
            ← Вернуться на главную страницу
          </Link>
        </div>
      </div>
    </div>
  );
}