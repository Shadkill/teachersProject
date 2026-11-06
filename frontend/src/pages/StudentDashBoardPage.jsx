import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  Download,
  FileText,
  LogOut,
  ArrowRight,
  Users,
  BookOpen,
  Video,
  Trash2,
  KeyRound,
  Clock,
  User,
  ExternalLink,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// Строгий словарь перевода типов занятий на русский язык
const TOPIC_TYPES = {
  HOMEWORK: 'Домашнее задание',
  CLASSWORK: 'Классная работа',
  LAB: 'Лабораторная работа',
  LECTURE: 'Лекция / Материал'
};

function getCurrentStudentFromToken() {
  try {
    const token = localStorage.getItem('abitsherpa_token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
    return {
      id: payload.id,
      fullName: payload.fullName || 'Студент',
      email: payload.email || ''
    };
  } catch {
    return null;
  }
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Курсы -> Темы -> Материалы -> Статус сдачи
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [mySubmissionsHistory, setMySubmissionsHistory] = useState([]);

  // Поля привязки к группе (Обязательный экран при отсутствии группы)
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);

  // Отправка решения
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Модальное окно редактирования профиля
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const token = localStorage.getItem('abitsherpa_token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchCourses = async (groupId) => {
    try {
      const res = await axios.get(`${API_BASE}/students/getCourse/${groupId}`, authHeaders);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.courses) ? raw.courses : []);
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourse((prev) => (prev ? list.find((c) => c.id === prev.id) || list[0] : list[0]));
      } else {
        setSelectedCourse(null);
      }
    } catch {
      setCourses([]);
      setSelectedCourse(null);
    }
  };

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await axios.get(`${API_BASE}/students/profile`, authHeaders);
      const user = res.data?.user || res.data;
      setProfile(user);
      setEditFullName(user?.fullName || '');

      if (user?.group?.id) {
        await fetchCourses(user.group.id);
      } else {
        setCourses([]);
        setSelectedCourse(null);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('abitsherpa_token');
        navigate('/student/login');
      } else {
        toast.error('Не удалось загрузить профиль студента');
      }
    } finally {
      setLoadingProfile(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  const fetchMySubmissionsHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/students/getSubmissions`, authHeaders);
      const list = Array.isArray(res.data?.submissions) ? res.data.submissions : (Array.isArray(res.data) ? res.data : []);
      setMySubmissionsHistory(list);
    } catch {
      setMySubmissionsHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/student/login');
      return;
    }
    fetchProfile();
    fetchMySubmissionsHistory();
  }, [token, navigate, fetchProfile, fetchMySubmissionsHistory]);

  const selectedCourseId = selectedCourse?.id;

  useEffect(() => {
    if (!selectedCourseId) {
      setTopics([]);
      setSelectedTopic(null);
      return;
    }
    const fetchTopics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/students/getTopic/${selectedCourseId}`, authHeaders);
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.topics) ? raw.topics : []);
        setTopics(list);
        setSelectedTopic((prev) => {
          if (list.length === 0) return null;
          if (prev && list.some((t) => Number(t.id) === Number(prev.id))) {
            return list.find((t) => Number(t.id) === Number(prev.id));
          }
          return list[0];
        });
      } catch {
        setTopics([]);
        setSelectedTopic(null);
      }
    };
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, token]);

  const fetchTopicDetails = async (topicId) => {
    if (!topicId) return;
    try {
      const [matRes, subRes] = await Promise.all([
        axios.get(`${API_BASE}/students/getMaterial/${topicId}`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/students/getSubmissionsByTopic/${topicId}`, authHeaders).catch(() => ({ data: { submitted: false } }))
      ]);

      const matList = Array.isArray(matRes.data) ? matRes.data : [];
      setMaterials(matList);

      if (subRes.data?.submitted) {
        setSubmissionStatus(subRes.data.submissions || subRes.data.submission || null);
      } else {
        setSubmissionStatus(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedTopicId = selectedTopic?.id;

  useEffect(() => {
    if (!selectedTopicId) {
      setMaterials([]);
      setSubmissionStatus(null);
      return;
    }
    fetchTopicDetails(selectedTopicId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopicId, token]);

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    const cleanCode = inviteCodeInput.trim();
    if (!cleanCode) {
      toast.error('Введите код приглашения группы');
      return;
    }

    setJoiningGroup(true);
    try {
      const res = await axios.post(
        `${API_BASE}/students/joinGroup`,
        { inviteCode: cleanCode },
        authHeaders
      );
      toast.success(res.data?.message || 'Вы успешно добавлены в учебную группу');
      setInviteCodeInput('');
      await fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Группа с таким кодом не найдена');
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      toast.error('ФИО не может быть пустым');
      return;
    }
    setUpdatingProfile(true);
    try {
      await axios.put(
        `${API_BASE}/students/updateProfile`,
        { fullName: editFullName.trim() },
        authHeaders
      );
      toast.success('Профиль успешно обновлен');
      setShowProfileModal(false);
      await fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Не удалось обновить профиль');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDownloadMaterial = async (material) => {
    try {
      const res = await axios.get(`${API_BASE}/students/downloadMaterial/${material.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material.originalFileName || `material_${material.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Ошибка при скачивании материала');
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedTopic?.id) return;
    if (!selectedFile) {
      toast.error('Выберите файл для отправки');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('topicId', selectedTopic.id);

    setUploading(true);
    try {
      const res = await axios.post(`${API_BASE}/students/submissions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(res.data?.message || 'Домашняя работа успешно отправлена');
      setSelectedFile(null);
      await fetchTopicDetails(selectedTopic.id);
      await fetchMySubmissionsHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при отправке работы');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionStatus?.id) return;
    try {
      await axios.delete(`${API_BASE}/students/deleteSubmissions`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { submissionId: submissionStatus.id }
      });
      toast.success('Отправленная работа отозвана');
      setSubmissionStatus(null);
      await fetchMySubmissionsHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Не удалось удалить работу');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('abitsherpa_token');
    navigate('/student/login');
  };

  const tokenUser = getCurrentStudentFromToken();
  const currentStudentName = profile?.fullName || tokenUser?.fullName || 'Студент';

  if (loadingProfile) {
    return (
      <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: '14px', color: '#c3c3cc' }}>Загрузка учебного профиля...</div>
      </div>
    );
  }

  // ==========================================================================
  // ЭКРАН 1: ОБЯЗАТЕЛЬНАЯ ПРИВЯЗКА К ГРУППЕ (ПРИ ОТСУТСТВИИ ГРУППЫ)
  // ==========================================================================
  if (!profile?.group?.id) {
    return (
      <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: '1px solid rgba(112, 112, 125, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '17px', fontWeight: 500 }}>АбитШерпа</span>
            <span style={{ fontSize: '11px', color: '#c3c3cc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>· Кабинет студента</span>
          </div>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Выйти
          </button>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '40px 32px', maxWidth: '460px', width: '100%', border: '1px solid rgba(112, 112, 125, 0.3)', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(82, 102, 235, 0.15)', color: '#5266eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto' }}>
              <Users size={26} />
            </div>

            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#5266eb', letterSpacing: '0.05em', fontWeight: 500 }}>
              Шаг 1 · Обязательная привязка
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 500, margin: '6px 0 10px 0', color: '#ededf3' }}>
              Присоединитесь к учебной группе
            </h1>
            <p style={{ fontSize: '13px', color: '#c3c3cc', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Здравствуйте, <strong style={{ color: '#ededf3' }}>{currentStudentName}</strong>. Вы ещё не состоите ни в одной учебной группе. Введите код приглашения группы, выданный старостой или преподавателем, чтобы открыть доступ к вашим дисциплинам, лекциям и сдаче заданий.
            </p>

            <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>
                  Код приглашения группы
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#c3c3cc' }} />
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="Например: ИСП-31-2026"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      backgroundColor: '#272735',
                      border: '1px solid #70707d',
                      borderRadius: '32px',
                      color: '#ededf3',
                      padding: '12px 18px 12px 44px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      letterSpacing: '0.04em'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={joiningGroup}
                style={{
                  backgroundColor: '#5266eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '32px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: joiningGroup ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                <span>{joiningGroup ? 'Проверка кода...' : 'Привязаться к группе и войти'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // ЭКРАН 2: ПОЛНОЦЕННЫЙ ЛИЧНЫЙ КАБИНЕТ СТУДЕНТА В СТИЛЕ ДАШБОРДА ПРЕПОДАВАТЕЛЯ
  // ==========================================================================
  return (
    <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', padding: '28px 24px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Шапка кабинета с выводом текущего студента */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(112, 112, 125, 0.25)', paddingBottom: '18px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.05em' }}>
                Студент: {currentStudentName}
              </span>
              <span style={{ backgroundColor: '#5266eb', color: '#ffffff', borderRadius: '32px', padding: '2px 10px', fontSize: '11px', fontWeight: 500 }}>
                Группа: {profile.group.name}
              </span>
            </div>
            <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 500 }}>
              Учебные дисциплины, материалы и сдача работ
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowProfileModal(true)}
              style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <User size={14} /> Настройки профиля
            </button>
            <button
              onClick={handleLogout}
              style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Выйти
            </button>
          </div>
        </header>

        {/* 1. Блоки учебных дисциплин как дашборд */}
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.04em' }}>
                Раздел 01 · Учебные дисциплины
              </span>
              <h2 style={{ fontSize: '19px', margin: '2px 0 0 0', fontWeight: 500 }}>
                Дисциплины учебной группы {profile.group.name} ({courses.length})
              </h2>
            </div>
          </div>

          {courses.length === 0 ? (
            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
              <BookOpen size={36} style={{ color: '#5266eb', marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>Для вашей группы курсы ещё не назначены</div>
              <p style={{ color: '#c3c3cc', fontSize: '13px', margin: 0 }}>
                Преподаватели привяжут учебные курсы в ближайшее время.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                const teachersList = Array.isArray(c?.teachers)
                  ? c.teachers
                  : c?.teachers && typeof c.teachers === 'object' && c.teachers.fullName
                    ? [c.teachers]
                    : [];

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourse(c)}
                    style={{
                      backgroundColor: '#1e1e2a',
                      borderRadius: '12px',
                      padding: '22px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #5266eb' : '1px solid rgba(112, 112, 125, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: '32px',
                          backgroundColor: isSelected ? '#5266eb' : '#272735',
                          color: '#ededf3',
                          fontWeight: 500,
                          display: 'inline-block',
                          marginBottom: '10px'
                        }}
                      >
                        {isSelected ? 'Активная дисциплина' : 'Курс'}
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: 500, margin: '0 0 6px 0', color: '#ededf3' }}>
                        {c.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.description || 'Описание дисциплины не заполнено'}
                      </p>
                    </div>

                    <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(112, 112, 125, 0.18)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#c3c3cc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <GraduationCap size={13} color="#5266eb" /> Преподаватели курса:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {teachersList.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#ededf3' }}>Преподаватель кафедры</span>
                        ) : (
                          teachersList.map((t, idx) => (
                            <span
                              key={t.id || idx}
                              style={{
                                fontSize: '12px',
                                backgroundColor: '#272735',
                                color: '#ededf3',
                                padding: '3px 10px',
                                borderRadius: '32px',
                                border: '1px solid rgba(112, 112, 125, 0.3)'
                              }}
                            >
                              {t.fullName || 'Преподаватель'}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Панель выбранного курса и тем занятий */}
        {selectedCourse && (
          <section style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '26px', marginBottom: '28px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 500 }}>{selectedCourse.name}</h2>
                <span style={{ fontSize: '11px', backgroundColor: '#272735', border: '1px solid #70707d', padding: '2px 10px', borderRadius: '32px', color: '#c3c3cc' }}>
                  Дисциплина курса
                </span>
              </div>
              {selectedCourse.description && (
                <p style={{ fontSize: '13px', color: '#c3c3cc', margin: '0 0 10px 0' }}>{selectedCourse.description}</p>
              )}
            </div>

            <div>
              <span style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '8px' }}>
                Тема учебного плана:
              </span>
              {topics.length === 0 ? (
                <div style={{ color: '#c3c3cc', fontSize: '13px', backgroundColor: '#272735', padding: '12px 18px', borderRadius: '32px' }}>
                  В выбранном курсе пока нет опубликованных тем занятий.
                </div>
              ) : (
                <select
                  value={selectedTopic?.id || ''}
                  onChange={(e) => setSelectedTopic(topics.find((t) => t.id === Number(e.target.value)))}
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', borderRadius: '32px', padding: '10px 18px', outline: 'none', fontSize: '13px' }}
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({TOPIC_TYPES[t.type] || t.type || 'Домашнее задание'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </section>
        )}

        {/* 3. Рабочая область выбранной темы: Материалы и Сдача ДЗ */}
        {selectedCourse && selectedTopic && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Левая колонка: Описание, видео, материалы темы в виде блоков */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', padding: '3px 12px', borderRadius: '32px', fontSize: '11px', fontWeight: 500 }}>
                    {TOPIC_TYPES[selectedTopic.type] || selectedTopic.type || 'Задание'}
                  </span>
                  {selectedTopic.deadline && (
                    <span style={{ fontSize: '12px', color: '#c3c3cc', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> Дедлайн сдачи: {new Date(selectedTopic.deadline).toLocaleString('ru-RU')}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 10px 0', color: '#ededf3' }}>
                  {selectedTopic.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#c3c3cc', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                  {selectedTopic.description || 'Методические указания к занятию не указаны.'}
                </p>

                {/* Ссылки на видеоматериалы */}
                {Array.isArray(selectedTopic.videoUrls) && selectedTopic.videoUrls.length > 0 && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', color: '#c3c3cc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Video size={14} color="#5266eb" /> Видеолекции к теме:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedTopic.videoUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#5266eb', backgroundColor: '#272735', padding: '6px 14px', borderRadius: '32px', textDecoration: 'none', border: '1px solid rgba(82, 102, 235, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          Видеоматериал #{idx + 1} <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Материалы темы в виде блоков */}
                <div style={{ fontSize: '12px', color: '#c3c3cc', marginBottom: '10px' }}>Учебно-методические материалы:</div>
                {materials.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#70707d' }}>К данной теме файлы не прикреплены.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {materials.map((m) => {
                      const fileLabel = m.title || m.originalFileName || `Материал #${m.id}`;
                      const extBadge = (fileLabel.split('.').pop() || 'ДОК').toUpperCase();

                      return (
                        <div
                          key={m.id}
                          style={{
                            backgroundColor: '#272735',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid rgba(112, 112, 125, 0.25)',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1e1e2a', border: '1px solid rgba(82, 102, 235, 0.4)', color: '#5266eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600, flexShrink: 0 }}>
                              <FileText size={13} />
                              <span>{extBadge.slice(0, 4)}</span>
                            </div>
                            <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileLabel}>
                              {fileLabel}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDownloadMaterial(m)}
                            style={{ backgroundColor: '#1e1e2a', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                          >
                            <Download size={12} /> Скачать
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Статус проверки работы */}
              {selectedTopic.allowSubmission && (
                <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
                  <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', fontWeight: 500 }}>Статус проверки работы</h3>
                  {submissionStatus ? (
                    <div style={{ backgroundColor: '#272735', borderRadius: '10px', padding: '16px', border: '1px solid rgba(112, 112, 125, 0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'monospace' }}>
                          {submissionStatus.originalFileName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              backgroundColor: submissionStatus.status === 'REVIEWED' ? '#5266eb' : '#1e1e2a',
                              color: '#fff',
                              border: '1px solid rgba(112, 112, 125, 0.4)'
                            }}
                          >
                            {submissionStatus.status === 'REVIEWED'
                              ? 'Проверено'
                              : submissionStatus.status === 'REJECTED'
                                ? 'На доработку'
                                : 'На проверке'}
                          </span>
                          {submissionStatus.isLate && (
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                backgroundColor: 'rgba(220, 38, 38, 0.25)',
                                color: '#fca5a5',
                                border: '1px solid rgba(220, 38, 38, 0.5)'
                              }}
                            >
                              Сдано после дедлайна
                            </span>
                          )}
                        </div>
                      </div>

                      {submissionStatus.teacherComment && (
                        <div style={{ backgroundColor: '#1e1e2a', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '10px' }}>
                          <strong style={{ color: '#5266eb' }}>Рецензия и оценка преподавателя: </strong>
                          {submissionStatus.teacherComment}
                        </div>
                      )}

                      {submissionStatus.status !== 'REVIEWED' && (
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={handleDeleteSubmission}
                            style={{ background: 'none', border: '1px solid #70707d', color: '#c3c3cc', borderRadius: '32px', padding: '6px 14px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={12} /> Отозвать отправленный файл
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#c3c3cc', fontSize: '13px' }}>
                      По теме «{selectedTopic.title}» решение ещё не отправлено.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Правая колонка: Форма отправки архива на проверку */}
            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)', alignSelf: 'start' }}>
              {!selectedTopic.allowSubmission ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <BookOpen size={32} style={{ color: '#5266eb', marginBottom: '10px' }} />
                  <h3 style={{ fontSize: '16px', margin: '0 0 6px 0', fontWeight: 500 }}>Лекционный материал</h3>
                  <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45 }}>
                    Для данной темы отправка практических или домашних работ не предусмотрена учебным планом.
                  </p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '18px', margin: '0 0 6px 0', fontWeight: 500 }}>
                    {submissionStatus ? 'Обновить решение' : 'Отправить решение'}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#c3c3cc', margin: '0 0 20px 0' }}>
                    Загрузите архив с выполненным заданием (лимит: 50 МБ)
                  </p>

                  <form onSubmit={handleSubmitWork} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        border: '2px dashed #70707d',
                        borderRadius: '12px',
                        padding: '36px 20px',
                        textAlign: 'center',
                        backgroundColor: '#272735',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('studentFileInput').click()}
                    >
                      <UploadCloud size={34} style={{ color: '#5266eb', margin: '0 auto 8px auto' }} />
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#ededf3' }}>
                        {selectedFile ? selectedFile.name : 'Нажмите для выбора архива с заданием'}
                      </div>
                      {selectedFile && (
                        <div style={{ fontSize: '11px', color: '#c3c3cc', marginTop: '4px' }}>
                          Размер файла: {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                        </div>
                      )}
                      <input
                        id="studentFileInput"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      style={{
                        backgroundColor: '#5266eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '32px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: uploading ? 'wait' : 'pointer'
                      }}
                    >
                      {uploading ? 'Отправка на сервер...' : 'Отправить работу на проверку'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        )}

        {/* 4. История всех сданных работ студента */}
        <section style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 16px 0', fontWeight: 500 }}>
            История всех сданных работ ({mySubmissionsHistory.length})
          </h3>

          {mySubmissionsHistory.length === 0 ? (
            <div style={{ color: '#c3c3cc', fontSize: '13px' }}>У вас пока нет отправленных домашних работ.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
              {mySubmissionsHistory.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: '#272735',
                    borderRadius: '10px',
                    padding: '16px 18px',
                    border: '1px solid rgba(112, 112, 125, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'monospace', color: '#ededf3' }}>
                        {sub.originalFileName}
                      </span>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          backgroundColor: sub.status === 'REVIEWED' ? '#5266eb' : '#1e1e2a',
                          color: '#fff'
                        }}
                      >
                        {sub.status === 'REVIEWED' ? 'Проверено' : sub.status === 'REJECTED' ? 'На доработку' : 'На проверке'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#c3c3cc' }}>
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleString('ru-RU') : ''}
                    </div>

                    {sub.teacherComment && (
                      <div style={{ marginTop: '8px', fontSize: '12px', backgroundColor: '#1e1e2a', padding: '8px 10px', borderRadius: '6px' }}>
                        <strong style={{ color: '#5266eb' }}>Рецензия: </strong> {sub.teacherComment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Модальное окно настроек профиля студента */}
      {showProfileModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '420px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px' }}>Настройки профиля</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>ФИО студента *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Учебная почта</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#70707d', padding: '10px 16px', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
                <button type="submit" disabled={updatingProfile} style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: updatingProfile ? 'wait' : 'pointer' }}>
                  {updatingProfile ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}