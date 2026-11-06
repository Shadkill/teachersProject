import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, X } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import MercuryModal from '../components/MercuryModal';
import { notifySuccess, notifyError } from '../utils/notify';
import { parseJwtPayload } from '../middlewares/ProtectedRoute';

// Палитра Mercury Blue Hour (строго по DESIGN.md)
const MERCURY = {
  canvas: '#171721',      // --color-onyx-canvas
  card: '#1e1e2a',        // --color-graphite-card
  obsidian: '#272735',    // --color-obsidian-button
  slateBorder: '#70707d', // --color-slate-border
  mistBorder: '#e2e3ed',  // --color-mist-border
  ashText: '#c3c3cc',     // --color-ash-text
  ivoryText: '#ededf3',   // --color-ivory-text
  cobalt: '#5266eb',      // --color-cobalt
  pureWhite: '#ffffff',   // --color-pure-white
};

// Человекочитаемые русские статусы (под капотом на сервере остаются ON_REVIEW / REVIEWED / REJECTED)
export const SUBMISSION_STATUS_UI = {
  ON_REVIEW: {
    label: 'На проверке',
    color: '#5266eb',
    bg: '#272735',
    border: '#70707d',
  },
  REVIEWED: {
    label: 'Проверено',
    color: '#ededf3',
    bg: '#5266eb',
    border: '#5266eb',
  },
  REJECTED: {
    label: 'На доработку',
    color: '#c3c3cc',
    bg: '#272735',
    border: '#e2e3ed',
  },
};

// Данные для графика распределения работ по группам курса
const GROUPS_ANALYTICS_DATA = [
  { group: 'ИСП-31', Проверено: 18, 'На проверке': 4, 'На доработке': 2 },
  { group: 'КБ-21', Проверено: 14, 'На проверке': 3, 'На доработке': 1 },
  { group: 'ПИ-42', Проверено: 16, 'На проверке': 5, 'На доработке': 0 },
];

// Данные для кольцевого графика статусов внутри выбранной темы
const TOPIC_PIE_DATA = [
  { name: 'Проверено', value: 18, color: '#5266eb' },
  { name: 'На проверке', value: 4, color: '#ededf3' },
  { name: 'На доработке', value: 2, color: '#70707d' },
  { name: 'Не сдано', value: 3, color: '#272735' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Поле ввода кода приглашения в Hero-секции
  const [inviteCode, setInviteCode] = useState('');

  // Состояния интерактивной демонстрации структуры курса
  const [selectedGroup, setSelectedGroup] = useState('ИСП-31');
  const [selectedTopic, setSelectedTopic] = useState(
    'Тема 01. Многоверсионность (MVCC) и уровни изоляции'
  );

  // Управление модальными окнами (без системных alert/confirm)
  const [authModalMode, setAuthModalMode] = useState(null); // 'login' | 'register' | 'invite' | null

  // Проверяем, авторизован ли уже пользователь через JWT-токен
  const token = localStorage.getItem('abitsherpa_token');
  const currentUser = parseJwtPayload(token);

  // Обработка формы «Код приглашения» в Hero
  const handleInviteSubmit = (e) => {
    e.preventDefault();
    const cleaned = inviteCode.trim();
    if (!cleaned) {
      notifyError('Введите код приглашения группы или преподавателя');
      return;
    }
    // Сохраняем код приглашения в sessionStorage для автоподстановки на странице регистрации или входа
    sessionStorage.setItem('abitsherpa_invite_code', cleaned);
    notifySuccess(`Код приглашения ${cleaned} сохранён`);
    setAuthModalMode('invite');
  };

  // Переход в защищенные разделы с проверкой токена
  const handleProtectedGoto = (path, roleLabel) => {
    if (!currentUser) {
      notifyError(`Для перехода в раздел «${roleLabel}» выполните вход`);
      setAuthModalMode('login');
      return;
    }
    navigate(path);
  };

  return (
    <div
      style={{
        backgroundColor: MERCURY.canvas,
        color: MERCURY.ivoryText,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      className="min-h-screen flex flex-col selection:bg-[#5266eb] selection:text-white"
    >
      {/* Калибровка промежуточных весов шрифта из DESIGN.md (weight 480) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');
        .mercury-display {
          font-weight: 480;
          line-height: 1.1;
          letter-spacing: 0.01em;
        }
        .mercury-heading-lg {
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 480;
          line-height: 1.15;
          letter-spacing: 0.42px;
        }
        .mercury-heading-sm {
          font-size: 24px;
          font-weight: 480;
          line-height: 1.2;
          letter-spacing: 0.42px;
        }
        .mercury-body-lg {
          font-size: 18px;
          font-weight: 480;
          line-height: 1.4;
        }
        .mercury-body {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
        }
        .mercury-caption {
          font-size: 12px;
          font-weight: 480;
          line-height: 1;
          letter-spacing: 0.04em;
        }
      `}</style>

      {/* ПРОЗРАЧНАЯ НАВИГАЦИОННАЯ ПАНЕЛЬ MERCURY С BACKDROP-BLUR */}
      <header
        style={{
          backgroundColor: 'rgba(23, 23, 33, 0.82)',
          borderBottom: '1px solid rgba(112, 112, 125, 0.16)',
        }}
        className="sticky top-0 z-40 backdrop-blur-xl"
      >
        <div className="max-w-[1200px] mx-auto px-6 h-[76px] flex items-center justify-between gap-4">
          {/* Логотип «АбитШерпа» */}
          <a href="#top" className="flex items-center gap-3.5 group">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="transition-transform duration-300 group-hover:scale-105"
            >
              <circle cx="16" cy="16" r="14.5" stroke={MERCURY.ivoryText} strokeWidth="1.25" />
              <circle
                cx="16"
                cy="16"
                r="8.5"
                stroke={MERCURY.ivoryText}
                strokeWidth="1.25"
                strokeOpacity="0.6"
              />
              <circle cx="16" cy="16" r="3" fill={MERCURY.cobalt} />
            </svg>
            <div>
              <span className="text-[19px] tracking-wide block leading-none" style={{ fontWeight: 480 }}>
                АбитШерпа
              </span>
              <span
                className="mercury-caption text-[10px] mt-1 block uppercase"
                style={{ color: MERCURY.ashText }}
              >
                Образовательная платформа
              </span>
            </div>
          </a>

          {/* Навигационные пиллы */}
          <nav className="hidden lg:flex items-center gap-1">
            <a
              href="#analytics"
              style={{ borderRadius: '40px', color: MERCURY.ivoryText }}
              className="px-5 py-2 text-[15px] hover:bg-[#272735] transition-colors"
            >
              Графики и аналитика
            </a>
            <a
              href="#workflow"
              style={{ borderRadius: '40px', color: MERCURY.ivoryText }}
              className="px-5 py-2 text-[15px] hover:bg-[#272735] transition-colors"
            >
              Структура курсов
            </a>
            <button
              onClick={() => handleProtectedGoto('/teacher/dashboard', 'Кабинет преподавателя')}
              style={{ borderRadius: '40px', color: MERCURY.ashText }}
              className="px-5 py-2 text-[15px] hover:text-[#ededf3] hover:bg-[#272735] transition-colors"
            >
              Преподавателям
            </button>
            <button
              onClick={() => handleProtectedGoto('/student/dashboard', 'Кабинет студента')}
              style={{ borderRadius: '40px', color: MERCURY.ashText }}
              className="px-5 py-2 text-[15px] hover:text-[#ededf3] hover:bg-[#272735] transition-colors"
            >
              Студентам
            </button>
          </nav>

          {/* Правая группа кнопок: Вход и единственный Cobalt CTA */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() =>
                  navigate(
                    currentUser.role === 'STUDENT' ? '/student/dashboard' : '/teacher/dashboard'
                  )
                }
                style={{
                  backgroundColor: MERCURY.cobalt,
                  color: MERCURY.pureWhite,
                  borderRadius: '32px',
                }}
                className="px-6 py-2.5 text-[14px] hover:opacity-95 transition-opacity"
              >
                Перейти в кабинет
              </button>
            ) : (
              <>
                <button
                  onClick={() => setAuthModalMode('login')}
                  style={{
                    border: `1px solid ${MERCURY.ivoryText}`,
                    color: MERCURY.ivoryText,
                    borderRadius: '40px',
                  }}
                  className="px-5 py-2 text-[14px] hover:bg-white/5 transition-colors"
                >
                  Войти
                </button>
                <button
                  onClick={() => setAuthModalMode('register')}
                  style={{
                    backgroundColor: MERCURY.cobalt,
                    color: MERCURY.pureWhite,
                    borderRadius: '32px',
                  }}
                  className="px-5 py-2 text-[14px] hover:opacity-95 transition-opacity"
                >
                  Создать аккаунт
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO-СЕКЦИЯ В СИНИЙ ЧАС (FULL-BLEED HERO) */}
      <main id="top" className="flex-1">
        <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden px-6 py-24">
          {/* Атмосферный горный пейзаж в синий час */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="mercuryBlueHour" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d111e" />
                  <stop offset="46%" stopColor="#17203a" />
                  <stop offset="80%" stopColor="#191c2b" />
                  <stop offset="100%" stopColor="#171721" />
                </linearGradient>
                <radialGradient id="horizonCobalt" cx="50%" cy="44%" r="48%">
                  <stop offset="0%" stopColor="#5266eb" stopOpacity="0.22" />
                  <stop offset="65%" stopColor="#232c5c" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#171721" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="1600" height="900" fill="url(#mercuryBlueHour)" />
              <rect width="1600" height="900" fill="url(#horizonCobalt)" />
              <path
                d="M0 530 L230 370 L450 465 L710 250 L960 420 L1210 280 L1430 410 L1600 325 L1600 900 L0 900 Z"
                fill="#171b2b"
                opacity="0.88"
              />
              <path
                d="M0 615 L310 445 L560 555 L860 355 L1140 525 L1380 405 L1600 500 L1600 900 L0 900 Z"
                fill="#151724"
              />
              <path
                d="M0 715 L440 595 L800 668 L1220 562 L1600 660 L1600 900 L0 900 Z"
                fill="#171721"
              />
              <line
                x1="690"
                y1="642"
                x2="910"
                y2="642"
                stroke="#ededf3"
                strokeOpacity="0.22"
                strokeWidth="1.5"
              />
              <rect
                x="786"
                y="624"
                width="28"
                height="18"
                fill="none"
                stroke="#ededf3"
                strokeOpacity="0.38"
                strokeWidth="1.2"
              />
            </svg>
          </div>

          <div className="relative z-10 max-w-[660px] mx-auto text-center">
            <div
              style={{
                backgroundColor: 'rgba(30, 30, 42, 0.78)',
                color: MERCURY.ashText,
                borderRadius: '40px',
                border: '1px solid rgba(226, 227, 237, 0.16)',
              }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 text-[12px] mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MERCURY.cobalt }} />
              <span>Образовательная платформа обмена материалами и рецензирования</span>
            </div>

            <h1
              style={{ color: MERCURY.pureWhite, fontSize: 'clamp(38px, 5.8vw, 65px)' }}
              className="mercury-display"
            >
              Спокойная архитектура учебного процесса
            </h1>

            <p
              style={{ color: MERCURY.ivoryText }}
              className="mercury-body-lg mt-6 max-w-[540px] mx-auto opacity-90"
            >
              Создавайте курсы, привязывайте учебные группы, публикуйте серии видеолекций и проверяйте работы студентов с развёрнутым комментарием и графической аналитикой.
            </p>

            {/* Сдвоенная капсула ввода «Кода приглашения» (по DESIGN.md: 32px слева + Cobalt справа) */}
            <form onSubmit={handleInviteSubmit} className="mt-10 flex items-stretch max-w-[540px] mx-auto">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Введите код приглашения..."
                style={{
                  backgroundColor: 'rgba(23, 23, 33, 0.65)',
                  borderTop: `1px solid ${MERCURY.ivoryText}`,
                  borderBottom: `1px solid ${MERCURY.ivoryText}`,
                  borderLeft: `1px solid ${MERCURY.ivoryText}`,
                  borderRight: 'none',
                  borderRadius: '32px 0 0 32px',
                  color: MERCURY.ivoryText,
                }}
                className="flex-1 px-6 py-3.5 text-[16px] placeholder-[#c3c3cc] focus:outline-none"
              />
              <button
                type="submit"
                style={{
                  backgroundColor: MERCURY.cobalt,
                  color: MERCURY.pureWhite,
                  borderRadius: '0 32px 32px 0',
                }}
                className="px-7 py-3.5 text-[16px] shrink-0 hover:opacity-95 transition-opacity"
              >
                Применить код
              </button>
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/teacher/login')}
                style={{
                  border: `1px solid ${MERCURY.ivoryText}`,
                  color: MERCURY.ivoryText,
                  borderRadius: '40px',
                }}
                className="px-5 py-2.5 text-[14px] hover:bg-white/5 transition-colors"
              >
                Вход для преподавателя →
              </button>
              <button
                type="button"
                onClick={() => navigate('/student/login')}
                style={{
                  border: `1px solid ${MERCURY.ivoryText}`,
                  color: MERCURY.ivoryText,
                  borderRadius: '40px',
                }}
                className="px-5 py-2.5 text-[14px] hover:bg-white/5 transition-colors"
              >
                Вход для студента →
              </button>
            </div>
          </div>
        </section>

        {/* СЕКЦИЯ 1: ГРАФИКИ ПРОГРЕССА ГРУПП (RECHARTS ВМЕСТО СУХИХ ЦИФР) */}
        <section id="analytics" className="max-w-[1200px] mx-auto px-6 py-[72px]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="mercury-caption uppercase block mb-3" style={{ color: MERCURY.ashText }}>
                Наглядная статистика проверки
              </span>
              <h2 className="mercury-heading-lg">Графики прогресса групп вместо сухих цифр</h2>
            </div>
            <p className="mercury-body max-w-md" style={{ color: MERCURY.ashText }}>
              Преподаватель вписывает оценку и подробное заключение прямо в комментарий к работе, а соотношение проверенных и ожидающих проверки ответов строится на графиках.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Столбчатая диаграмма по группам курса */}
            <div
              style={{ backgroundColor: MERCURY.card, borderRadius: '12px', padding: '32px' }}
              className="lg:col-span-7 flex flex-col justify-between"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="mercury-caption uppercase" style={{ color: MERCURY.ashText }}>
                    Сравнение групп внутри курса
                  </span>
                  <h3 className="mercury-heading-sm mt-1">Динамика сдачи и проверки по группам</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[12px]" style={{ color: MERCURY.ashText }}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#5266eb' }} />
                    Проверено
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ededf3' }} />
                    На проверке
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#70707d' }} />
                    На доработке
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={GROUPS_ANALYTICS_DATA} barGap={6}>
                    <XAxis
                      dataKey="group"
                      stroke={MERCURY.ashText}
                      tick={{ fill: MERCURY.ivoryText, fontSize: 13 }}
                      axisLine={{ stroke: 'rgba(112,112,125,0.25)' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={MERCURY.ashText}
                      tick={{ fill: MERCURY.ashText, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(39, 39, 53, 0.5)' }}
                      contentStyle={{
                        backgroundColor: MERCURY.obsidian,
                        border: `1px solid ${MERCURY.slateBorder}`,
                        borderRadius: '12px',
                        color: MERCURY.ivoryText,
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="Проверено" fill="#5266eb" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="На проверке" fill="#ededf3" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="На доработке" fill="#70707d" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Кольцевая диаграмма по выбранной теме */}
            <div
              style={{ backgroundColor: MERCURY.card, borderRadius: '12px', padding: '32px' }}
              className="lg:col-span-5 flex flex-col justify-between"
            >
              <div>
                <span className="mercury-caption uppercase" style={{ color: MERCURY.ashText }}>
                  Статусы работ по теме
                </span>
                <h3 className="mercury-heading-sm mt-1">Соотношение ответов в группе</h3>
              </div>

              <div className="h-[210px] w-full flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={TOPIC_PIE_DATA}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {TOPIC_PIE_DATA.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: MERCURY.obsidian,
                        border: `1px solid ${MERCURY.slateBorder}`,
                        borderRadius: '12px',
                        color: MERCURY.ivoryText,
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                className="grid grid-cols-2 gap-2.5 pt-2"
                style={{ borderTop: '1px solid rgba(112,112,125,0.2)' }}
              >
                {TOPIC_PIE_DATA.map((item) => (
                  <div
                    key={item.name}
                    style={{ backgroundColor: MERCURY.obsidian, borderRadius: '10px' }}
                    className="px-3.5 py-2 flex items-center justify-between text-[13px]"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span style={{ color: MERCURY.ashText }}>{item.name}</span>
                    </span>
                    <span style={{ color: MERCURY.ivoryText, fontWeight: 480 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* СЕКЦИЯ 2: НАВИГАЦИЯ ВНУТРИ КУРСА (КУРС -> ГРУППА -> ФИЛЬТР ПО ТЕМЕ -> РАБОТЫ) */}
        <section id="workflow" className="max-w-[1200px] mx-auto px-6 py-[72px]">
          <div className="mb-10">
            <span className="mercury-caption uppercase block mb-3" style={{ color: MERCURY.ashText }}>
              Логика работы преподавателя
            </span>
            <h2 className="mercury-heading-lg">
              Курс → Привязанные группы → Фильтр по теме → Работы
            </h2>
            <p className="mercury-body mt-3 max-w-2xl" style={{ color: MERCURY.ashText }}>
              Открывая курс, преподаватель видит привязанные к нему группы, выбирает нужную группу и фильтрует работы по конкретной теме.
            </p>
          </div>

          <div
            style={{ backgroundColor: MERCURY.card, borderRadius: '12px', padding: '32px' }}
            className="space-y-8"
          >
            <div
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6"
              style={{ borderBottom: '1px solid rgba(112,112,125,0.2)' }}
            >
              <div className="space-y-2">
                <div className="text-[13px]" style={{ color: MERCURY.ashText }}>
                  1. Выберите группу, привязанную к курсу:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {['ИСП-31', 'КБ-21', 'ПИ-42'].map((grp) => {
                    const active = selectedGroup === grp;
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSelectedGroup(grp)}
                        style={{
                          backgroundColor: active ? MERCURY.cobalt : MERCURY.obsidian,
                          color: active ? '#ffffff' : MERCURY.ivoryText,
                          borderRadius: '40px',
                        }}
                        className="px-5 py-2 text-[14px] transition-colors"
                      >
                        Группа {grp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 min-w-[300px]">
                <div className="text-[13px]" style={{ color: MERCURY.ashText }}>
                  2. Отфильтруйте тему в группе {selectedGroup}:
                </div>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  style={{
                    backgroundColor: MERCURY.obsidian,
                    border: `1px solid ${MERCURY.slateBorder}`,
                    borderRadius: '32px',
                    color: MERCURY.ivoryText,
                  }}
                  className="w-full px-5 py-2.5 text-[14px] focus:outline-none"
                >
                  <option value="Тема 01. Многоверсионность (MVCC) и уровни изоляции">
                    Тема 01. Многоверсионность (MVCC) и уровни изоляции
                  </option>
                  <option value="Тема 02. Индексы B-Tree и оптимизация планов запросов">
                    Тема 02. Индексы B-Tree и оптимизация планов запросов
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  student: 'Лебедев Кирилл Андреевич',
                  file: 'Lebedev_MVCC_Lab01.zip',
                  status: 'REVIEWED',
                  comment:
                    'Оценка: 5 (Отлично). Уровни изоляции транзакций разобраны верно, код без замечаний.',
                },
                {
                  student: 'Морозова Анна Сергеевна',
                  file: 'Morozova_Transactions.zip',
                  status: 'ON_REVIEW',
                  comment: 'Работа ожидает рецензии и оценки преподавателя в комментарии.',
                },
                {
                  student: 'Васильев Дмитрий Игоревич',
                  file: 'Vasilev_Draft.rar',
                  status: 'REJECTED',
                  comment:
                    'На доработку: добавьте SQL-скрипт демонстрации фантомного чтения и отправьте заново.',
                },
              ].map((item, idx) => {
                const st = SUBMISSION_STATUS_UI[item.status];
                return (
                  <div
                    key={idx}
                    style={{ backgroundColor: MERCURY.obsidian, borderRadius: '12px', padding: '24px' }}
                    className="flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[12px]" style={{ color: MERCURY.ashText }}>
                          Группа {selectedGroup}
                        </span>
                        <span
                          style={{
                            backgroundColor: st.bg,
                            color: st.color,
                            border: `1px solid ${st.border}`,
                            borderRadius: '40px',
                          }}
                          className="px-3 py-1 text-[12px]"
                        >
                          {st.label}
                        </span>
                      </div>
                      <h4 className="text-[17px]" style={{ fontWeight: 480 }}>
                        {item.student}
                      </h4>
                      <div className="text-[13px] font-mono mt-1" style={{ color: MERCURY.ashText }}>
                        {item.file}
                      </div>
                    </div>

                    <div
                      className="pt-3 text-[13px]"
                      style={{ borderTop: '1px solid rgba(112,112,125,0.2)' }}
                    >
                      <span className="block text-[11px] uppercase mb-1" style={{ color: MERCURY.ashText }}>
                        Комментарий преподавателя (с оценкой):
                      </span>
                      «{item.comment}»
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* МОДАЛЬНОЕ ОКНО ВЫБОРА РОЛИ (ВХОД / РЕГИСТРАЦИЯ / КОД ПРИГЛАШЕНИЯ) */}
      <MercuryModal
        isOpen={Boolean(authModalMode)}
        onClose={() => setAuthModalMode(null)}
        subtitle="Маршрутизация доступа"
        title={
          authModalMode === 'register'
            ? 'Создание аккаунта в «АбитШерпа»'
            : authModalMode === 'invite'
            ? `Код приглашения: ${inviteCode}`
            : 'Выберите ваш контур для входа'
        }
      >
        <div className="space-y-3">
          <div
            style={{ backgroundColor: MERCURY.obsidian, borderRadius: '12px' }}
            className="p-5 flex items-center justify-between gap-4"
          >
            <div>
              <div className="text-[17px]" style={{ fontWeight: 480 }}>
                Преподаватель
              </div>
              <div className="text-[13px] mt-1" style={{ color: MERCURY.ashText }}>
                Управление курсами, привязка групп, публикация тем и рецензирование
              </div>
            </div>
            <button
              onClick={() => {
                setAuthModalMode(null);
                navigate(authModalMode === 'register' || authModalMode === 'invite' ? '/teacher/register' : '/teacher/login');
              }}
              style={{ backgroundColor: MERCURY.cobalt, color: '#ffffff', borderRadius: '32px' }}
              className="px-5 py-2.5 text-[14px] shrink-0"
            >
              {authModalMode === 'register' || authModalMode === 'invite' ? 'Регистрация' : 'Войти'}
            </button>
          </div>

          <div
            style={{ backgroundColor: MERCURY.obsidian, borderRadius: '12px' }}
            className="p-5 flex items-center justify-between gap-4"
          >
            <div>
              <div className="text-[17px]" style={{ fontWeight: 480 }}>
                Студент
              </div>
              <div className="text-[13px] mt-1" style={{ color: MERCURY.ashText }}>
                Вступление в группу по коду приглашения, материалы и отправка работ
              </div>
            </div>
            <button
              onClick={() => {
                setAuthModalMode(null);
                navigate(authModalMode === 'register' ? '/student/register' : '/student/login');
              }}
              style={{
                border: `1px solid ${MERCURY.ivoryText}`,
                color: MERCURY.ivoryText,
                borderRadius: '40px',
              }}
              className="px-5 py-2.5 text-[14px] shrink-0 hover:bg-white/5"
            >
              {authModalMode === 'register' ? 'Регистрация' : 'Войти'}
            </button>
          </div>
        </div>
      </MercuryModal>

      {/* ПОДВАЛ (DISCLAIMER BANNER) */}
      <footer
        style={{
          backgroundColor: MERCURY.canvas,
          borderTop: '1px solid rgba(112, 112, 125, 0.18)',
        }}
        className="py-10"
      >
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[12px]" style={{ color: MERCURY.ivoryText, fontWeight: 480 }}>
            АбитШерпа · Образовательная платформа обмена учебными материалами и проверки работ
          </p>
          <p className="text-[12px]" style={{ color: MERCURY.ashText }}>
            Сервер API: http://localhost:5000/api
          </p>
        </div>
      </footer>
    </div>
  );
}