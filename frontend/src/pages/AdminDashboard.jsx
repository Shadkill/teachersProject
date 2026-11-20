import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Users,
  GraduationCap,
  BookOpen,
  KeyRound,
  LogOut,
  Ban,
  Snowflake,
  Trash2,
  Plus,
  Search,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  Dna,
  Pencil
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('students'); // students, teachers, groups, invites
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Данные
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);

  // --- Состояния модальных окон ---
  const [submitting, setSubmitting] = useState(false);
  const [actionItemId, setActionItemId] = useState(null);

  // 1. Студенты (Бан и Удаление)
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [reasonInput, setReasonInput] = useState('');

  // 2. Преподаватели (Заморозка и Удаление)
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [targetTeacher, setTargetTeacher] = useState(null);

  // 3. Группы (Создание, Редактирование, Удаление и Привязка)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupInvite, setNewGroupInvite] = useState('');

  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');

  // 4. Инвайты
  const [newInviteCode, setNewInviteCode] = useState('');

  const token = localStorage.getItem('abitsherpa_admin_token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ==========================================
  // ЗАГРУЗКА ДАННЫХ
  // ==========================================

  const loadStudents = useCallback(async (query = '') => {
    try {
      const res = await axios.get(`${API_BASE}/admin/getStudents${query ? `?name=${query}` : ''}`, authHeaders);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/admin/login');
      else toast.error('Ошибка загрузки студентов');
    }
  }, [token, navigate]);

  const loadTeachers = useCallback(async (query = '') => {
    try {
      const res = await axios.get(`${API_BASE}/admin/getTeachers${query ? `?name=${query}` : ''}`, authHeaders);
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Ошибка загрузки преподавателей');
    }
  }, [token]);

  const loadGroups = useCallback(async (query = '') => {
    try {
      const res = await axios.get(`${API_BASE}/admin/getAllGroups${query ? `?name=${query}` : ''}`, authHeaders);
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Ошибка загрузки групп');
    }
  }, [token]);

  const loadInviteCodes = useCallback(async () => {
    try {
      // Синхронизировано с маршрутом GET /admin/getInviteCode на бэкенде
      const res = await axios.get(`${API_BASE}/admin/getInviteCode`, authHeaders);
      setInviteCodes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Ошибка загрузки инвайт-кодов');
    }
  }, [token]);

  // Вызов загрузки при смене вкладки
  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    setLoading(true);
    const delayDebounce = setTimeout(() => {
      if (activeTab === 'students') loadStudents(searchQuery);
      if (activeTab === 'teachers') loadTeachers(searchQuery);
      if (activeTab === 'groups') loadGroups(searchQuery);
      if (activeTab === 'invites') loadInviteCodes();
      setLoading(false);
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [activeTab, searchQuery, loadStudents, loadTeachers, loadGroups, loadInviteCodes, token, navigate]);

  // ==========================================
  // ДЕЙСТВИЯ СО СТУДЕНТАМИ
  // ==========================================

  const handleBanStudent = async (e) => {
    e.preventDefault();
    if (!reasonInput.trim() || submitting) return !reasonInput.trim() ? toast.error('Укажите причину блокировки') : null;
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE}/admin/banStudents`, {
        id: targetStudent.id,
        banReason: reasonInput.trim()
      }, authHeaders);
      toast.success(`Студент ${targetStudent.fullName} заблокирован!`);
      setShowBanModal(false);
      setReasonInput('');
      loadStudents(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при блокировке');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnbanStudent = async (id) => {
    if (actionItemId === id) return;
    setActionItemId(id);
    try {
      await axios.put(`${API_BASE}/admin/unBanStudents`, { id }, authHeaders);
      toast.success('Аккаунт успешно разблокирован!');
      loadStudents(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка разблокировки');
    } finally {
      setActionItemId(null);
    }
  };

  const handleDeleteStudent = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE}/admin/deleteStudents`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { id: targetStudent.id, deleteReason: reasonInput.trim() || 'Решение администрации' }
      });
      toast.success('Студент удален из системы!');
      setShowDeleteStudentModal(false);
      setReasonInput('');
      loadStudents(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при удалении');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ДЕЙСТВИЯ С ПРЕПОДАВАТЕЛЯМИ
  // ==========================================

  const handleFreezeTeacher = async (e) => {
    e.preventDefault();
    if (!reasonInput.trim() || submitting) return !reasonInput.trim() ? toast.error('Укажите причину заморозки') : null;
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE}/admin/freezeTeacher`, {
        id: targetTeacher.id,
        freezeReason: reasonInput.trim()
      }, authHeaders);
      toast.success(`Аккаунт ${targetTeacher.fullName} заморожен!`);
      setShowFreezeModal(false);
      setReasonInput('');
      loadTeachers(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при заморозке');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnfreezeTeacher = async (id) => {
    if (actionItemId === id) return;
    setActionItemId(id);
    try {
      await axios.put(`${API_BASE}/admin/unFreezeTeacher`, { id }, authHeaders);
      toast.success('Аккаунт преподавателя разморожен!');
      loadTeachers(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка разморозки');
    } finally {
      setActionItemId(null);
    }
  };

  const handleDeleteTeacher = async (e) => {
    e.preventDefault();
    if (!reasonInput.trim() || submitting) return !reasonInput.trim() ? toast.error('Укажите причину удаления') : null;
    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE}/admin/deleteTeacher`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { id: targetTeacher.id, deleteReason: reasonInput.trim() }
      });
      toast.success(`Преподаватель ${targetTeacher.fullName} удален из системы!`);
      setShowDeleteTeacherModal(false);
      setReasonInput('');
      loadTeachers(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при удалении преподавателя');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ДЕЙСТВИЯ С ГРУППАМИ
  // ==========================================

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/admin/groupCreate`, {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        inviteCode: newGroupInvite.trim()
      }, authHeaders);
      toast.success('Группа успешно создана!');
      setShowGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupInvite('');
      loadGroups(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка создания группы');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditGroupModal = (group) => {
    setTargetGroup(group);
    setEditGroupName(group.name || '');
    setEditGroupDesc(group.description || '');
    setShowEditGroupModal(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!targetGroup?.id || submitting) return;
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE}/admin/updateDataGroup`, {
        id: targetGroup.id,
        name: editGroupName.trim(),
        description: editGroupDesc.trim()
      }, authHeaders);
      toast.success('Данные группы успешно обновлены!');
      setShowEditGroupModal(false);
      setTargetGroup(null);
      loadGroups(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при обновлении группы');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!targetGroup?.id || submitting) return;
    setSubmitting(true);
    try {
      await axios.delete(`${API_BASE}/admin/deleteGroup`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { id: targetGroup.id }
      });
      toast.success(`Группа «${targetGroup.name}» удалена!`);
      setShowDeleteGroupModal(false);
      setTargetGroup(null);
      loadGroups(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при удалении группы');
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = () => {
    if (teachers.length === 0) loadTeachers();
    setShowAssignModal(true);
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/admin/addTeacherByGroup`, {
        groupId: assignGroupId,
        teacherId: assignTeacherId
      }, authHeaders);
      toast.success('Преподаватель привязан к группе!');
      setShowAssignModal(false);
      setAssignGroupId('');
      setAssignTeacherId('');
      loadGroups(searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка привязки');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ДЕЙСТВИЯ С ИНВАЙТ-КОДАМИ
  // ==========================================

  const generateRandomCode = () => {
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewInviteCode(`PREPOD-${randomChars}`);
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!newInviteCode.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/createInviteCode`, { code: newInviteCode.trim() }, authHeaders);
      toast.success('Код приглашения добавлен!');

      if (res.data?.inviteCode) {
        setInviteCodes((prev) => [...prev, res.data.inviteCode]);
      } else {
        await loadInviteCodes();
      }
      setNewInviteCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка создания кода');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvite = async (id) => {
    if (actionItemId === id) return;
    setActionItemId(id);
    try {
      await axios.delete(`${API_BASE}/admin/deleteInviteCode/${id}`, authHeaders);
      toast.success('Код успешно удален!');
      setInviteCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Не удалось удалить код');
    } finally {
      setActionItemId(null);
    }
  };

  // ==========================================
  // UI РЕНДЕР
  // ==========================================

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
      {[
        { id: 'students', label: 'Студенты', icon: <GraduationCap size={16} /> },
        { id: 'teachers', label: 'Преподаватели', icon: <BookOpen size={16} /> },
        { id: 'groups', label: 'Учебные группы', icon: <Users size={16} /> },
        { id: 'invites', label: 'Инвайт-коды', icon: <KeyRound size={16} /> }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            setSearchQuery('');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: activeTab === tab.id ? '#5266eb' : '#272735',
            color: activeTab === tab.id ? '#ffffff' : '#ededf3',
            border: activeTab === tab.id ? '1px solid #5266eb' : '1px solid #70707d',
            padding: '10px 18px',
            borderRadius: '32px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', padding: '28px 24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(112, 112, 125, 0.25)', paddingBottom: '18px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldAlert size={16} color="#e5484d" />
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.05em' }}>
                Терминал суперпользователя
              </span>
            </div>
            <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 500 }}>
              Панель администратора
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('abitsherpa_admin_token');
              navigate('/admin/login');
            }}
            style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Выйти
          </button>
        </header>

        {renderTabs()}

        {/* SEARCH BAR (кроме вкладки инвайтов) */}
        {activeTab !== 'invites' && (
          <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#70707d' }} />
            <input
              type="text"
              placeholder="Поиск по имени или названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', backgroundColor: '#1e1e2a', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '10px 16px 10px 42px', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* ======================= СТУДЕНТЫ ======================= */}
        {activeTab === 'students' && (
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', border: '1px solid rgba(112, 112, 125, 0.25)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '640px' }}>
              <thead style={{ backgroundColor: '#272735', borderBottom: '1px solid #70707d', fontSize: '12px', color: '#c3c3cc', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>№ п/п</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>ФИО Студента</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>Email</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>Статус</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500, textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#c3c3cc' }}>Загрузка...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#70707d' }}>Студенты не найдены</td></tr>
                ) : (
                  students.map((s, index) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(112, 112, 125, 0.15)', fontSize: '13px' }}>
                      <td style={{ padding: '16px 20px', color: '#70707d' }}>#{index + 1}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 500 }}>{s.fullName}</td>
                      <td style={{ padding: '16px 20px', color: '#c3c3cc' }}>{s.email}</td>
                      <td style={{ padding: '16px 20px' }}>
                        {s.isBanned ? (
                          <span style={{ backgroundColor: 'rgba(229, 72, 77, 0.15)', color: '#fca5a5', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: '1px solid rgba(229, 72, 77, 0.3)' }}>Заблокирован</span>
                        ) : (
                          <span style={{ backgroundColor: 'rgba(82, 102, 235, 0.15)', color: '#a5b4fc', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: '1px solid rgba(82, 102, 235, 0.3)' }}>Активен</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {s.isBanned ? (
                            <button
                              disabled={actionItemId === s.id}
                              onClick={() => handleUnbanStudent(s.id)}
                              style={{ backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', borderRadius: '32px', padding: '6px 12px', fontSize: '11px', cursor: actionItemId === s.id ? 'wait' : 'pointer', opacity: actionItemId === s.id ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <CheckCircle2 size={12} /> {actionItemId === s.id ? 'Разбан...' : 'Разбанить'}
                            </button>
                          ) : (
                            <button onClick={() => { setTargetStudent(s); setReasonInput(''); setShowBanModal(true); }} style={{ backgroundColor: 'rgba(229, 72, 77, 0.1)', border: '1px solid rgba(229, 72, 77, 0.3)', color: '#fca5a5', borderRadius: '32px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Ban size={12} /> Забанить
                            </button>
                          )}
                          <button onClick={() => { setTargetStudent(s); setReasonInput(''); setShowDeleteStudentModal(true); }} style={{ backgroundColor: '#e5484d', border: 'none', color: '#fff', borderRadius: '32px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={12} /> Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================= ПРЕПОДАВАТЕЛИ ======================= */}
        {activeTab === 'teachers' && (
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', border: '1px solid rgba(112, 112, 125, 0.25)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '640px' }}>
              <thead style={{ backgroundColor: '#272735', borderBottom: '1px solid #70707d', fontSize: '12px', color: '#c3c3cc', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>№ п/п</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>ФИО Преподавателя</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>Email</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500 }}>Статус</th>
                  <th style={{ padding: '16px 20px', fontWeight: 500, textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#c3c3cc' }}>Загрузка...</td></tr>
                ) : teachers.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#70707d' }}>Преподаватели не найдены</td></tr>
                ) : (
                  teachers.map((t, index) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(112, 112, 125, 0.15)', fontSize: '13px' }}>
                      <td style={{ padding: '16px 20px', color: '#70707d' }}>#{index + 1}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 500 }}>{t.fullName}</td>
                      <td style={{ padding: '16px 20px', color: '#c3c3cc' }}>{t.email}</td>
                      <td style={{ padding: '16px 20px' }}>
                        {t.freeze ? (
                          <span style={{ backgroundColor: 'rgba(112, 112, 125, 0.2)', color: '#c3c3cc', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: '1px solid #70707d' }}>Заморожен</span>
                        ) : (
                          <span style={{ backgroundColor: 'rgba(82, 102, 235, 0.15)', color: '#a5b4fc', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', border: '1px solid rgba(82, 102, 235, 0.3)' }}>Активен</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {t.freeze ? (
                            <button
                              disabled={actionItemId === t.id}
                              onClick={() => handleUnfreezeTeacher(t.id)}
                              style={{ backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', borderRadius: '32px', padding: '6px 12px', fontSize: '11px', cursor: actionItemId === t.id ? 'wait' : 'pointer', opacity: actionItemId === t.id ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <CheckCircle2 size={12} /> {actionItemId === t.id ? 'Разморозка...' : 'Разморозить'}
                            </button>
                          ) : (
                            <button onClick={() => { setTargetTeacher(t); setReasonInput(''); setShowFreezeModal(true); }} style={{ backgroundColor: '#272735', border: '1px solid rgba(112, 112, 125, 0.4)', color: '#c3c3cc', borderRadius: '32px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Snowflake size={12} /> Заморозить
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTargetTeacher(t);
                              setReasonInput('');
                              setShowDeleteTeacherModal(true);
                            }}
                            style={{ backgroundColor: '#e5484d', border: 'none', color: '#fff', borderRadius: '32px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={12} /> Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================= ГРУППЫ ======================= */}
        {activeTab === 'groups' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button onClick={() => setShowGroupModal(true)} style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} /> Создать группу
              </button>
              <button onClick={openAssignModal} style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserPlus size={15} /> Назначить преподавателя
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {loading ? (
                <div style={{ color: '#c3c3cc', padding: '20px' }}>Загрузка...</div>
              ) : groups.length === 0 ? (
                <div style={{ color: '#70707d', padding: '20px' }}>Учебные группы не найдены.</div>
              ) : (
                groups.map((g, index) => (
                  <div key={g.id} style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '22px', border: '1px solid rgba(112, 112, 125, 0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>{g.name}</h3>
                        <span style={{ fontSize: '11px', color: '#70707d', backgroundColor: '#272735', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>
                          Группа #{index + 1}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.4 }}>{g.description || 'Описание отсутствует'}</p>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(112, 112, 125, 0.2)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Инвайт-код для студентов:</span>
                        <span style={{ backgroundColor: '#272735', border: '1px solid #70707d', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', color: '#ededf3', display: 'inline-block' }}>
                          {g.inviteCode}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditGroupModal(g)}
                          title="Редактировать группу"
                          style={{ backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', borderRadius: '32px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Pencil size={12} /> Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetGroup(g);
                            setShowDeleteGroupModal(true);
                          }}
                          title="Удалить группу"
                          style={{ backgroundColor: 'rgba(229, 72, 77, 0.14)', border: '1px solid rgba(229, 72, 77, 0.35)', color: '#fca5a5', borderRadius: '32px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================= ИНВАЙТ-КОДЫ (ПРЕПОДАВАТЕЛЕЙ) ======================= */}
        {activeTab === 'invites' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
              <h3 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#5266eb" /> Создать инвайт-код
              </h3>
              <p style={{ fontSize: '13px', color: '#c3c3cc', marginBottom: '20px', lineHeight: 1.5 }}>
                Создайте уникальный код. Преподаватели смогут использовать его при регистрации в системе.
              </p>
              <form onSubmit={handleCreateInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Например: PREPOD-2026-X"
                    value={newInviteCode}
                    onChange={(e) => setNewInviteCode(e.target.value)}
                    disabled={submitting}
                    required
                    style={{ flex: 1, backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '12px 16px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={generateRandomCode}
                    style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '0 16px', fontSize: '12px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    title="Сгенерировать уникальный код"
                  >
                    <Dna size={15} color="#5266eb" /> Сгенерировать
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '12px', fontSize: '14px', fontWeight: 500, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}
                >
                  {submitting ? 'Сохранение...' : 'Сохранить код'}
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
              <h3 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="#5266eb" /> Активные коды ({inviteCodes.length})
              </h3>

              {inviteCodes.length === 0 ? (
                <div style={{ color: '#c3c3cc', fontSize: '13px', backgroundColor: '#272735', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  Активных инвайт-кодов нет
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inviteCodes.map((codeObj) => (
                    <div key={codeObj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#272735', padding: '12px 16px', borderRadius: '8px', border: '1px solid #70707d' }}>
                      <span style={{ fontFamily: 'monospace', color: '#ededf3', fontSize: '14px' }}>{codeObj.code}</span>
                      <button
                        disabled={actionItemId === codeObj.id}
                        onClick={() => handleDeleteInvite(codeObj.id)}
                        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: actionItemId === codeObj.id ? 'wait' : 'pointer', opacity: actionItemId === codeObj.id ? 0.45 : 1, display: 'flex', alignItems: 'center', padding: '4px' }}
                        title="Удалить код"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          МОДАЛЬНЫЕ ОКНА
      ========================================== */}

      {/* 1. БАН СТУДЕНТА */}
      {showBanModal && targetStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid rgba(229, 72, 77, 0.4)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ededf3' }}>Блокировка аккаунта</h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', marginBottom: '16px' }}>Вы собираетесь заблокировать студента: <strong>{targetStudent.fullName}</strong></p>
            <form onSubmit={handleBanStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                placeholder="Укажите причину блокировки для письма..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                required
                disabled={submitting}
                rows={3}
                style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" disabled={submitting} onClick={() => setShowBanModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#e5484d', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                  {submitting ? 'Блокировка...' : 'Заблокировать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. УДАЛЕНИЕ СТУДЕНТА */}
      {showDeleteStudentModal && targetStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid rgba(229, 72, 77, 0.8)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18} /> Безвозвратное удаление</h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', marginBottom: '16px' }}>Студент <strong>{targetStudent.fullName}</strong> и все его работы будут удалены из системы.</p>
            <form onSubmit={handleDeleteStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                placeholder="Причина удаления (пойдет в email)..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                required
                disabled={submitting}
                rows={2}
                style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" disabled={submitting} onClick={() => setShowDeleteStudentModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#e5484d', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                  {submitting ? 'Удаление...' : 'Удалить навсегда'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ЗАМОРОЗКА ПРЕПОДАВАТЕЛЯ */}
      {showFreezeModal && targetTeacher && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ededf3' }}>Заморозка аккаунта</h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', marginBottom: '16px' }}>Вы замораживаете преподавателя: <strong>{targetTeacher.fullName}</strong></p>
            <form onSubmit={handleFreezeTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                placeholder="Причина заморозки (для уведомления)..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                required
                disabled={submitting}
                rows={3}
                style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" disabled={submitting} onClick={() => setShowFreezeModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                  {submitting ? 'Заморозка...' : 'Заморозить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.5. УДАЛЕНИЕ ПРЕПОДАВАТЕЛЯ */}
      {showDeleteTeacherModal && targetTeacher && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid rgba(229, 72, 77, 0.8)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} /> Удаление преподавателя
            </h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', marginBottom: '16px' }}>
              Учётная запись преподавателя <strong>{targetTeacher.fullName}</strong> ({targetTeacher.email}) будет безвозвратно удалена.
            </p>
            <form onSubmit={handleDeleteTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                placeholder="Причина удаления (пойдет в уведомление на почту)..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                required
                disabled={submitting}
                rows={2}
                style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" disabled={submitting} onClick={() => setShowDeleteTeacherModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#e5484d', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                  {submitting ? 'Удаление...' : 'Удалить преподавателя'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. СОЗДАНИЕ ГРУППЫ */}
      {showGroupModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Новая учебная группа</h3>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="text" placeholder="Название (напр. ИСП-31)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required disabled={submitting} style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Код для вступления студентов" value={newGroupInvite} onChange={(e) => setNewGroupInvite(e.target.value)} required disabled={submitting} style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }} />
              <textarea placeholder="Описание..." value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} required disabled={submitting} rows={3} style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" disabled={submitting} onClick={() => setShowGroupModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                  {submitting ? 'Создание...' : 'Создать группу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.5. РЕДАКТИРОВАНИЕ ГРУППЫ */}
      {showEditGroupModal && targetGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Редактировать учебную группу</h3>
            <form onSubmit={handleUpdateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Название группы *</label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  required
                  disabled={submitting}
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Описание группы *</label>
                <textarea
                  rows={3}
                  value={editGroupDesc}
                  onChange={(e) => setEditGroupDesc(e.target.value)}
                  required
                  disabled={submitting}
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" disabled={submitting} onClick={() => setShowEditGroupModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                  {submitting ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.6. УДАЛЕНИЕ ГРУППЫ */}
      {showDeleteGroupModal && targetGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid rgba(229, 72, 77, 0.45)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#ededf3' }}>Удаление учебной группы</h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Вы действительно хотите удалить группу <strong style={{ color: '#ededf3' }}>«{targetGroup.name}»</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" disabled={submitting} onClick={() => setShowDeleteGroupModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
              <button type="button" disabled={submitting} onClick={handleDeleteGroup} style={{ backgroundColor: '#e5484d', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                {submitting ? 'Удаление...' : 'Удалить группу'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. НАЗНАЧЕНИЕ ПРЕПОДАВАТЕЛЯ В ГРУППУ */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Назначить преподавателя</h3>
            <form onSubmit={handleAssignTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ fontSize: '12px', color: '#c3c3cc', marginBottom: '-8px' }}>Учебная группа</label>
              <select value={assignGroupId} onChange={(e) => setAssignGroupId(e.target.value)} required disabled={submitting} style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="" disabled>-- Выберите группу --</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>

              <label style={{ fontSize: '12px', color: '#c3c3cc', marginBottom: '-8px', marginTop: '4px' }}>Преподаватель</label>
              <select value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)} required disabled={submitting} style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="" disabled>-- Выберите преподавателя --</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>)}
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" disabled={submitting} onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: submitting ? 'not-allowed' : 'pointer' }}>Отмена</button>
                <button type="submit" disabled={submitting} style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.65 : 1 }}>
                  {submitting ? 'Привязка...' : 'Привязать к группе'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}