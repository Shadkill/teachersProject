import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Plus,
  Users,
  Download,
  MessageSquare,
  LogOut,
  X,
  Video,
  Paperclip,
  Trash2,
  BookOpen,
  FileText,
  GraduationCap,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const API_BASE = 'http://localhost:5000/api';

const TOPIC_TYPES = {
  HOMEWORK: 'Домашнее задание',
  CLASSWORK: 'Классная работа',
  LAB: 'Лабораторная работа',
  LECTURE: 'Лекция / Материал'
};

function getCurrentTeacherFromToken() {
  try {
    const token = localStorage.getItem('abitsherpa_token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
    return {
      id: payload.id,
      fullName: payload.fullName || 'Преподаватель курса',
      email: payload.email || ''
    };
  } catch {
    return null;
  }
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const currentTeacher = getCurrentTeacherFromToken();

  const [courses, setCourses] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseGroups, setCourseGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [groupStudents, setGroupStudents] = useState([]);
  const [groupsStats, setGroupsStats] = useState([]);

  // Modals state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialTopicId, setMaterialTopicId] = useState('');
  const [materialFile, setMaterialFile] = useState(null);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showDeleteTopicModal, setShowDeleteTopicModal] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);

  // Form states
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [coTeacherIdInput, setCoTeacherIdInput] = useState('');

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicType, setNewTopicType] = useState('HOMEWORK');
  const [newTopicAllowSub, setNewTopicAllowSub] = useState(true);
  const [newTopicDeadline, setNewTopicDeadline] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [newTopicVideoUrls, setNewTopicVideoUrls] = useState([]);

  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('REVIEWED');
  const [teacherReviewComment, setTeacherReviewComment] = useState('');

  const token = localStorage.getItem('abitsherpa_token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const countSub = submissions.filter((s) => s.status === 'ON_REVIEW').length;
  const submittedIds = new Set(submissions.map((s) => Number(s.student?.id ?? s.studentId)));
  const notSubmitted = groupStudents.filter((st) => !submittedIds.has(Number(st.id)));

  const pieData = [
    { name: 'Проверено', value: submissions.filter((s) => s.status === 'REVIEWED').length, color: '#5266eb' },
    { name: 'На проверке', value: countSub, color: '#ededf3' },
    { name: 'На доработке', value: submissions.filter((s) => s.status === 'REJECTED').length, color: '#70707d' },
    { name: 'Ожидается сдача', value: notSubmitted.length, color: '#3a3a4d' }
  ];

  const tooltipStyle = {
    backgroundColor: '#272735',
    border: '1px solid #70707d',
    borderRadius: '12px',
    color: '#ededf3',
    fontSize: '13px'
  };

  const getCachedCourseTeachers = (courseId) => {
    try {
      const raw = localStorage.getItem(`abitsherpa_course_teachers_${courseId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveCachedCourseTeachers = (courseId, teachersArray) => {
    try {
      localStorage.setItem(`abitsherpa_course_teachers_${courseId}`, JSON.stringify(teachersArray));
    } catch (e) {
      console.error(e);
    }
  };

  const getCourseTeachersList = (courseObj, extraTeachers = []) => {
    if (!courseObj) return [];
    const serverTeachers = Array.isArray(courseObj.teachers)
      ? courseObj.teachers
      : courseObj.teachers && typeof courseObj.teachers === 'object' && courseObj.teachers.fullName
        ? [courseObj.teachers]
        : [];
    const cachedTeachers = courseObj.id ? getCachedCourseTeachers(courseObj.id) : [];
    const fallbackSelf = currentTeacher ? [currentTeacher] : [{ id: 0, fullName: 'Преподаватель курса' }];

    const mergedMap = new Map();
    [...fallbackSelf, ...cachedTeachers, ...serverTeachers, ...extraTeachers].forEach((t) => {
      if (t && (t.id !== undefined || t.fullName)) {
        const key = t.id !== undefined ? Number(t.id) : t.fullName;
        mergedMap.set(key, t);
      }
    });

    const finalTeachers = Array.from(mergedMap.values());
    if (courseObj.id && finalTeachers.length > 0) {
      saveCachedCourseTeachers(courseObj.id, finalTeachers);
    }
    return finalTeachers;
  };

  const fetchAllTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teachers/getAllTeachers`, authHeaders);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.teachers)
          ? raw.teachers
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
      setAllTeachers(list);
    } catch {
      setAllTeachers([]);
    }
  };

  const getCachedCourseGroups = (courseId) => {
    try {
      const raw = localStorage.getItem(`abitsherpa_course_groups_${courseId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveCachedCourseGroups = (courseId, groupsArray) => {
    try {
      localStorage.setItem(`abitsherpa_course_groups_${courseId}`, JSON.stringify(groupsArray));
    } catch (e) {
      console.error(e);
    }
  };

  const resolveCourseGroups = (courseObj, extraGroupsFromApi = []) => {
    if (!courseObj?.id) return [];
    const serverGroups = Array.isArray(courseObj.groups) ? courseObj.groups : [];
    const apiGroups = Array.isArray(extraGroupsFromApi) ? extraGroupsFromApi : [];
    const cachedGroups = getCachedCourseGroups(courseObj.id);

    const mergedMap = new Map();
    [...cachedGroups, ...serverGroups, ...apiGroups].forEach((g) => {
      if (g && g.id !== undefined) {
        mergedMap.set(Number(g.id), { ...g, id: Number(g.id) });
      }
    });

    const finalGroups = Array.from(mergedMap.values());
    if (finalGroups.length > 0) {
      saveCachedCourseGroups(courseObj.id, finalGroups);
    }
    return finalGroups;
  };

  const fetchAvailableGroups = async (loadedCourses = []) => {
    const defaultGroups = [
      { id: 1, name: 'ИСП-31' },
      { id: 2, name: 'КБ-21' },
      { id: 3, name: 'ПИ-42' }
    ];
    try {
      const res = await axios.get(`${API_BASE}/teachers/groups`, authHeaders);
      const list = Array.isArray(res.data?.groups) ? res.data.groups : Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        setAllGroups(list);
        return;
      }
    } catch {
      // Fallback
    }
    const map = new Map();
    defaultGroups.forEach((g) => map.set(Number(g.id), g));
    loadedCourses.forEach((c) => {
      if (Array.isArray(c.groups)) {
        c.groups.forEach((g) => map.set(Number(g.id), g));
      }
    });
    setAllGroups(Array.from(map.values()));
  };

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/teacher/courses`, authHeaders);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.courses) ? raw.courses : [];
      const enriched = list.map((c) => ({
        ...c,
        groups: resolveCourseGroups(c),
        teachers: getCourseTeachersList(c)
      }));
      setCourses(enriched);
      fetchAvailableGroups(enriched);
      if (enriched.length > 0) {
        setSelectedCourse((prev) => {
          if (!prev) return enriched[0];
          return enriched.find((c) => c.id === prev.id) || enriched[0];
        });
      }
    } catch {
      toast.error('Ошибка загрузки учебных курсов');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/teacher/login');
      return;
    }
    fetchCourses();
    fetchAllTeachers();
  }, [token, fetchCourses]);

  const loadTopicsAndGroups = async (courseTarget = selectedCourse) => {
    if (!courseTarget) return;
    try {
      const res = await axios.get(`${API_BASE}/teachers/courses/${courseTarget.id}`, authHeaders);
      const raw = res.data;
      const topicList = Array.isArray(raw) ? raw : Array.isArray(raw?.topics) ? raw.topics : [];
      setTopics(topicList);
      setSelectedTopic((prev) => {
        if (topicList.length === 0) return null;
        if (prev && topicList.some((t) => Number(t.id) === Number(prev.id))) {
          return topicList.find((t) => Number(t.id) === Number(prev.id));
        }
        return topicList[0];
      });

      const resolvedGroups = resolveCourseGroups(courseTarget, raw?.groups);
      setCourseGroups(resolvedGroups);
      setSelectedGroup((prev) => {
        if (resolvedGroups.length === 0) return null;
        if (prev && resolvedGroups.some((g) => Number(g.id) === Number(prev.id))) return prev;
        return resolvedGroups[0];
      });
    } catch {
      const fallbackGroups = resolveCourseGroups(courseTarget);
      setCourseGroups(fallbackGroups);
      setSelectedGroup(fallbackGroups.length > 0 ? fallbackGroups[0] : null);
      toast.error('Не удалось загрузить темы курса');
    }
  };

  useEffect(() => {
    if (!selectedCourse) return;
    loadTopicsAndGroups(selectedCourse);
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedTopic || !selectedGroup) {
      setSubmissions([]);
      return;
    }
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const statusQuery = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
        const res = await axios.get(
          `${API_BASE}/teachers/getSubmissions/${selectedTopic.id}?groupId=${selectedGroup.id}${statusQuery}`,
          authHeaders
        );
        setSubmissions(Array.isArray(res.data?.submissions) ? res.data.submissions : []);
      } catch {
        toast.error('Ошибка загрузки сданных работ');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [selectedTopic, selectedGroup, statusFilter]);

  const fetchGroupStudents = async (group) => {
    try {
      const res = await axios.get(`${API_BASE}/teachers/groups/${group.id}/students`, authHeaders);
      const list = Array.isArray(res.data) ? res.data : res.data?.students || [];
      if (list.length > 0) return list;
    } catch {
      // fallback
    }
    return Array.isArray(group.students) ? group.students : [];
  };

  useEffect(() => {
    if (!selectedGroup) {
      setGroupStudents([]);
      return;
    }
    fetchGroupStudents(selectedGroup).then(setGroupStudents);
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedTopic || courseGroups.length === 0) {
      setGroupsStats([]);
      return;
    }
    const loadStats = async () => {
      const stats = await Promise.all(
        courseGroups.map(async (g) => {
          let subs = [];
          try {
            const res = await axios.get(
              `${API_BASE}/teachers/getSubmissions/${selectedTopic.id}?groupId=${g.id}`,
              authHeaders
            );
            subs = Array.isArray(res.data?.submissions) ? res.data.submissions : [];
          } catch {
            // skip
          }
          const students = await fetchGroupStudents(g);
          const ids = new Set(subs.map((s) => Number(s.student?.id ?? s.studentId)));
          return {
            group: g.name,
            Проверено: subs.filter((s) => s.status === 'REVIEWED').length,
            'На проверке': subs.filter((s) => s.status === 'ON_REVIEW').length,
            'На доработке': subs.filter((s) => s.status === 'REJECTED').length,
            'Ожидается сдача': students.filter((st) => !ids.has(Number(st.id))).length
          };
        })
      );
      setGroupsStats(stats);
    };
    loadStats();
  }, [selectedTopic, courseGroups, submissions]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE}/teacher/createCourse`,
        { name: newCourseName, description: newCourseDesc },
        authHeaders
      );
      toast.success('Учебный курс успешно создан!');
      setShowCourseModal(false);
      setNewCourseName('');
      setNewCourseDesc('');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка создания курса');
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!targetGroupId) {
      toast.error('Выберите группу из списка');
      return;
    }
    const numericGroupId = Number(targetGroupId);
    try {
      await axios.post(
        `${API_BASE}/teachers/coursesAddGroup`,
        { courseId: selectedCourse.id, groupId: numericGroupId },
        authHeaders
      );

      const groupObj = allGroups.find((g) => Number(g.id) === numericGroupId) || {
        id: numericGroupId,
        name: `Группа #${numericGroupId}`
      };

      const updatedGroups = resolveCourseGroups(selectedCourse, [groupObj]);
      setCourseGroups(updatedGroups);
      setSelectedGroup(groupObj);
      setSelectedCourse((prev) => (prev ? { ...prev, groups: updatedGroups } : prev));
      setCourses((prev) =>
        prev.map((c) => (c.id === selectedCourse.id ? { ...c, groups: updatedGroups } : c))
      );

      toast.success(`Группа «${groupObj.name}» привязана к курсу!`);
      setShowGroupModal(false);
      setTargetGroupId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка привязки группы');
    }
  };

  const handleAddCoTeacher = async (e) => {
    e.preventDefault();
    if (!coTeacherIdInput || !selectedCourse?.id) {
      toast.error('Выберите преподавателя из списка');
      return;
    }
    const numericTeacherId = Number(coTeacherIdInput);
    try {
      await axios.post(
        `${API_BASE}/teachers/coursesAddTeacher`,
        { courseId: Number(selectedCourse.id), teacherId: numericTeacherId },
        authHeaders
      );

      const addedTeacherObj = allTeachers.find((t) => Number(t.id) === numericTeacherId) || {
        id: numericTeacherId,
        fullName: `Преподаватель #${numericTeacherId}`
      };

      const updatedTeachers = getCourseTeachersList(selectedCourse, [addedTeacherObj]);
      setSelectedCourse((prev) => (prev ? { ...prev, teachers: updatedTeachers } : prev));
      setCourses((prev) =>
        prev.map((c) => (c.id === selectedCourse.id ? { ...c, teachers: updatedTeachers } : c))
      );

      toast.success(`Преподаватель «${addedTeacherObj.fullName}» добавлен к курсу!`);
      setShowAddTeacherModal(false);
      setCoTeacherIdInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Не удалось добавить преподавателя');
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic?.id) return;
    setDeletingTopic(true);
    try {
      const topicTitle = selectedTopic.title;
      await axios.delete(`${API_BASE}/teachers/courses/deleteTopic/${selectedTopic.id}`, authHeaders);
      toast.success(`Тема «${topicTitle}» и прикрепленные файлы удалены!`);
      setShowDeleteTopicModal(false);
      await loadTopicsAndGroups(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при удалении темы');
    } finally {
      setDeletingTopic(false);
    }
  };

  const handleAddVideoLink = () => {
    const trimmed = videoUrlInput.trim();
    if (!trimmed) return;
    if (newTopicVideoUrls.includes(trimmed)) {
      toast.error('Эта ссылка уже добавлена');
      return;
    }
    setNewTopicVideoUrls((prev) => [...prev, trimmed]);
    setVideoUrlInput('');
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    const finalVideoUrls = [...newTopicVideoUrls];
    if (videoUrlInput.trim() && !finalVideoUrls.includes(videoUrlInput.trim())) {
      finalVideoUrls.push(videoUrlInput.trim());
    }

    let formattedDeadline = null;
    if (newTopicDeadline) {
      const parsedDate = new Date(newTopicDeadline);
      if (!isNaN(parsedDate.getTime())) {
        formattedDeadline = parsedDate.toISOString();
      }
    }

    try {
      await axios.post(
        `${API_BASE}/teachers/courses/createTopics`,
        {
          courseId: Number(selectedCourse.id),
          title: newTopicTitle.trim(),
          description: newTopicDesc.trim() || null,
          type: newTopicType,
          videoUrls: finalVideoUrls,
          allowSubmission: Boolean(newTopicAllowSub),
          deadline: formattedDeadline
        },
        authHeaders
      );

      toast.success('Тема успешно опубликована!');
      setShowTopicModal(false);
      setNewTopicTitle('');
      setNewTopicDesc('');
      setNewTopicType('HOMEWORK');
      setNewTopicAllowSub(true);
      setNewTopicDeadline('');
      setVideoUrlInput('');
      setNewTopicVideoUrls([]);

      await loadTopicsAndGroups(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Ошибка создания темы');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!materialTopicId) {
      toast.error('Выберите тему');
      return;
    }
    if (!materialFile) {
      toast.error('Выберите файл');
      return;
    }

    const formData = new FormData();
    formData.append('topicId', materialTopicId);
    formData.append('title', materialTitle.trim() || materialFile.name);
    formData.append('file', materialFile);

    setMaterialUploading(true);
    try {
      await axios.post(`${API_BASE}/materials`, formData, authHeaders);
      toast.success('Учебный материал успешно загружен!');
      setShowMaterialModal(false);
      setMaterialTitle('');
      setMaterialFile(null);
      setMaterialTopicId('');

      await loadTopicsAndGroups(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка загрузки материала');
    } finally {
      setMaterialUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId, fileName) => {
    if (!materialId) return;
    setDeletingMaterialId(materialId);
    try {
      await axios.delete(`${API_BASE}/teachers/deleteMaterials/${materialId}`, authHeaders);
      toast.success(`Материал «${fileName || 'файл'}» удалён`);

      setTopics((prevTopics) =>
        prevTopics.map((t) => {
          if (Number(t.id) !== Number(selectedTopic?.id)) return t;
          return {
            ...t,
            materials: Array.isArray(t.materials)
              ? t.materials.filter((m) => Number(m.id) !== Number(materialId))
              : []
          };
        })
      );
      setSelectedTopic((prev) =>
        prev
          ? {
              ...prev,
              materials: Array.isArray(prev.materials)
                ? prev.materials.filter((m) => Number(m.id) !== Number(materialId))
                : []
            }
          : prev
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Не удалось удалить материал');
    } finally {
      setDeletingMaterialId(null);
    }
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!currentSubmission) return;
    try {
      await axios.put(
        `${API_BASE}/teachers/reviewSubmission`,
        {
          submissionId: currentSubmission.id,
          teacherComment: teacherReviewComment,
          status: reviewStatus
        },
        authHeaders
      );
      toast.success('Рецензия и статус сохранены!');
      setShowReviewModal(false);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === currentSubmission.id
            ? { ...s, status: reviewStatus, teacherComment: teacherReviewComment }
            : s
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка сохранения рецензии');
    }
  };

  const handleDownload = async (subId) => {
    try {
      const response = await axios.get(`${API_BASE}/teachers/submissionsDownload/${subId}`, {
        ...authHeaders,
        responseType: 'blob'
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });

      let fileName = `submission-${subId}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*?=["']?(?:UTF-8'')?([^"'\n;]*)["']?/i);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = decodeURIComponent(fileNameMatch[1]);
        }
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        toast.error(parsed.message || 'Ошибка скачивания файла');
      } else {
        toast.error(error.response?.data?.message || 'Ошибка скачивания файла');
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#171721', color: '#ededf3', minHeight: '100vh', padding: '28px 24px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(112, 112, 125, 0.25)', paddingBottom: '18px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.05em' }}>
              Академический контур преподавателя {currentTeacher?.fullName ? `· ${currentTeacher.fullName}` : ''}
            </span>
            <h1 style={{ fontSize: '26px', margin: '4px 0 0 0', fontWeight: 500 }}>
              Панель управления дисциплинами и аттестацией
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowCourseModal(true)}
              style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '10px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Создать курс
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('abitsherpa_token');
                navigate('/teacher/login');
              }}
              style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Выйти
            </button>
          </div>
        </header>

        {/* 1. Courses Dashboard Grid */}
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.04em' }}>
                Раздел 01 · Учебные дисциплины
              </span>
              <h2 style={{ fontSize: '19px', margin: '2px 0 0 0', fontWeight: 500 }}>
                Ваши учебные курсы ({Array.isArray(courses) ? courses.length : 0})
              </h2>
            </div>
          </div>

          {!Array.isArray(courses) || courses.length === 0 ? (
            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
              <BookOpen size={36} style={{ color: '#5266eb', marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>Учебные курсы ещё не созданы</div>
              <p style={{ color: '#c3c3cc', fontSize: '13px', margin: '0 auto 18px auto', maxWidth: '420px' }}>
                Создайте вашу первую дисциплину, чтобы привязать учебные группы, публиковать лекции и принимать работы студентов.
              </p>
              <button
                onClick={() => setShowCourseModal(true)}
                style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '10px 22px', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Создать первый курс
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                const teachersList = getCourseTeachersList(c);
                const cGroups = Array.isArray(c.groups) ? c.groups : [];

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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '3px 10px',
                            borderRadius: '32px',
                            backgroundColor: isSelected ? '#5266eb' : '#272735',
                            color: '#ededf3',
                            fontWeight: 500
                          }}
                        >
                          {isSelected ? 'Активный курс' : 'Дисциплина'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#c3c3cc', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Users size={13} /> Групп: {cGroups.length}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '17px', fontWeight: 500, margin: '0 0 6px 0', color: '#ededf3' }}>
                        {c.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#c3c3cc', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.description || 'Описание дисциплины не указано'}
                      </p>
                    </div>

                    <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(112, 112, 125, 0.18)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#c3c3cc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <GraduationCap size={13} color="#5266eb" /> Преподаватели курса:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {teachersList.map((t, idx) => (
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
                            {t.fullName || t.name || 'Преподаватель'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Selected Course Management Panel */}
        {selectedCourse && (
          <section style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '26px', marginBottom: '28px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 500 }}>{selectedCourse.name}</h2>
                  
                </div>
                <p style={{ fontSize: '13px', color: '#c3c3cc', margin: '0 0 12px 0' }}>
                  {selectedCourse.description || 'Описание дисциплины не заполнено'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#c3c3cc', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <GraduationCap size={14} color="#5266eb" /> Состав:
                  </span>
                  {getCourseTeachersList(selectedCourse).map((t, idx) => (
                    <span
                      key={t.id || idx}
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#272735',
                        color: '#ededf3',
                        padding: '4px 12px',
                        borderRadius: '32px',
                        border: '1px solid rgba(82, 102, 235, 0.4)'
                      }}
                    >
                      {t.fullName}
                    </span>
                  ))}
                  <button
                    onClick={() => setShowAddTeacherModal(true)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#c3c3cc',
                      border: '1px dashed #70707d',
                      borderRadius: '32px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <UserPlus size={12} /> + Соавтор
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowGroupModal(true)}
                  style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '9px 16px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Users size={14} /> Привязать группу
                </button>
                <button
                  onClick={() => {
                    setMaterialTopicId(selectedTopic?.id ? String(selectedTopic.id) : '');
                    setShowMaterialModal(true);
                  }}
                  disabled={topics.length === 0}
                  title={topics.length === 0 ? 'Сначала добавьте тему' : ''}
                  style={{
                    backgroundColor: '#272735',
                    color: '#ededf3',
                    border: '1px solid #70707d',
                    borderRadius: '32px',
                    padding: '9px 16px',
                    fontSize: '12px',
                    cursor: topics.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: topics.length === 0 ? 0.5 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Paperclip size={13} /> Загрузить материал
                </button>
                <button
                  onClick={() => setShowTopicModal(true)}
                  style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Добавить тему
                </button>
              </div>
            </div>

            {/* Groups and Topics filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', borderTop: '1px solid rgba(112, 112, 125, 0.2)', paddingTop: '18px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '8px' }}>
                  Учебные группы потока ({courseGroups.length}):
                </span>
                {!Array.isArray(courseGroups) || courseGroups.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#c3c3cc', backgroundColor: '#272735', border: '1px solid rgba(112, 112, 125, 0.35)', borderRadius: '32px', padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Группы ещё не привязаны</span>
                    <button onClick={() => setShowGroupModal(true)} style={{ background: 'none', border: 'none', color: '#5266eb', cursor: 'pointer', padding: 0, fontSize: '12px' }}>
                      + Привязать
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {courseGroups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(g)}
                        style={{
                          backgroundColor: Number(selectedGroup?.id) === Number(g.id) ? '#5266eb' : '#272735',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '32px',
                          padding: '7px 16px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {g.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowGroupModal(true)}
                      style={{ backgroundColor: 'transparent', color: '#c3c3cc', border: '1px dashed #70707d', borderRadius: '32px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      + Ещё
                    </button>
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '8px' }}>
                  Тема учебного плана:
                </span>
                {!Array.isArray(topics) || topics.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#c3c3cc', backgroundColor: '#272735', border: '1px solid rgba(112, 112, 125, 0.35)', borderRadius: '32px', padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Тем пока нет</span>
                    <button onClick={() => setShowTopicModal(true)} style={{ background: 'none', border: 'none', color: '#5266eb', cursor: 'pointer', padding: 0, fontSize: '12px' }}>
                      + Добавить тему
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={selectedTopic?.id || ''}
                      onChange={(e) => setSelectedTopic(topics.find((t) => t.id === Number(e.target.value)))}
                      style={{ flex: 1, backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', borderRadius: '32px', padding: '9px 16px', outline: 'none', fontSize: '13px' }}
                    >
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({TOPIC_TYPES[t.type] || t.type || 'Домашнее задание'})
                        </option>
                      ))}
                    </select>
                    {selectedTopic && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteTopicModal(true)}
                        title="Удалить выбранную тему"
                        style={{
                          backgroundColor: 'rgba(229, 72, 77, 0.14)',
                          color: '#fca5a5',
                          border: '1px solid rgba(229, 72, 77, 0.35)',
                          borderRadius: '32px',
                          padding: '9px 14px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Trash2 size={13} /> Удалить тему
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Materials and video links dashboard blocks */}
            {selectedTopic && (
              <div style={{ marginTop: '22px', paddingTop: '20px', borderTop: '1px solid rgba(112, 112, 125, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.04em' }}>
                      Учебно-методический комплекс темы
                    </span>
                    <h3 style={{ fontSize: '17px', margin: '2px 0 0 0', fontWeight: 500 }}>
                      Материалы и ресурсы: «{selectedTopic.title}»
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setMaterialTopicId(String(selectedTopic.id));
                      setShowMaterialModal(true);
                    }}
                    style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={13} /> Прикрепить файл к теме
                  </button>
                </div>

                {Array.isArray(selectedTopic.videoUrls) && selectedTopic.videoUrls.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    {selectedTopic.videoUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#272735',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          border: '1px solid rgba(82, 102, 235, 0.35)',
                          textDecoration: 'none',
                          color: '#ededf3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(82, 102, 235, 0.18)', color: '#5266eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Video size={16} />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>Видеоматериал #{idx + 1}</div>
                            <div style={{ fontSize: '11px', color: '#c3c3cc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {url}
                            </div>
                          </div>
                        </div>
                        <ExternalLink size={14} color="#5266eb" style={{ flexShrink: 0 }} />
                      </a>
                    ))}
                  </div>
                )}

                {!Array.isArray(selectedTopic.materials) || selectedTopic.materials.length === 0 ? (
                  <div style={{ backgroundColor: '#272735', borderRadius: '10px', padding: '18px 20px', color: '#c3c3cc', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span>К данной теме учебные файлы ещё не прикреплены.</span>
                    <button
                      onClick={() => {
                        setMaterialTopicId(String(selectedTopic.id));
                        setShowMaterialModal(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#5266eb', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                    >
                      + Загрузить первый материал
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '12px' }}>
                    {selectedTopic.materials.map((m) => {
                      const fileLabel = m.title || m.originalFileName || `Материал #${m.id}`;
                      const sizeMb = m.fileSize ? `${(Number(m.fileSize) / 1024 / 1024).toFixed(2)} МБ` : 'Файл курса';
                      const extBadge = (m.fileExt || '').replace('.', '').toUpperCase() || 'DOC';

                      return (
                        <div
                          key={m.id}
                          style={{
                            backgroundColor: '#272735',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            border: '1px solid rgba(112, 112, 125, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                backgroundColor: '#1e1e2a',
                                border: '1px solid rgba(82, 102, 235, 0.4)',
                                color: '#5266eb',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 600,
                                flexShrink: 0
                              }}
                            >
                              <FileText size={14} />
                              <span>{extBadge}</span>
                            </div>

                            <div style={{ overflow: 'hidden' }}>
                              <div
                                title={fileLabel}
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#ededf3',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {fileLabel}
                              </div>
                              <div style={{ fontSize: '11px', color: '#c3c3cc', marginTop: '2px' }}>
                                {sizeMb}
                                {m.createdAt ? ` · ${new Date(m.createdAt).toLocaleDateString('ru-RU')}` : ''}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={deletingMaterialId === m.id}
                            onClick={() => handleDeleteMaterial(m.id, fileLabel)}
                            title="Удалить материал с сервера"
                            style={{
                              backgroundColor: 'rgba(229, 72, 77, 0.14)',
                              color: '#fca5a5',
                              border: '1px solid rgba(229, 72, 77, 0.35)',
                              borderRadius: '32px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              cursor: deletingMaterialId === m.id ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0
                            }}
                          >
                            <Trash2 size={13} />
                            <span>{deletingMaterialId === m.id ? '...' : 'Удалить'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 3. Analytics charts */}
        {selectedTopic && selectedGroup && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.04em' }}>
                Аналитика успеваемости по потокам
              </span>
              <h3 style={{ fontSize: '18px', margin: '4px 0 16px 0', fontWeight: 500 }}>
                Статистика групп
              </h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupsStats} barGap={4}>
                    <XAxis dataKey="group" stroke="#c3c3cc" tick={{ fill: '#ededf3', fontSize: 13 }} axisLine={{ stroke: 'rgba(112,112,125,0.25)' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#c3c3cc', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(39,39,53,0.5)' }} contentStyle={tooltipStyle} />
                    <Bar dataKey="Проверено" fill="#5266eb" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="На проверке" fill="#ededf3" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="На доработке" fill="#70707d" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Ожидается сдача" fill="#e5484d" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.04em' }}>
                Показатели группы {selectedGroup.name}
              </span>
              <h3 style={{ fontSize: '18px', margin: '4px 0 0 0', fontWeight: 500 }}>
                Распределение работ по статусам
              </h3>
              <div style={{ height: '185px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                      {pieData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {pieData.map((item) => (
                  <div key={item.name} style={{ backgroundColor: '#272735', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c3c3cc' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.04em' }}>
                Контроль дисциплины · {selectedGroup.name}
              </span>
              <h3 style={{ fontSize: '18px', margin: '4px 0 14px 0', fontWeight: 500 }}>
                Ожидается сдача работ ({notSubmitted.length})
              </h3>
              {groupStudents.length === 0 ? (
                <div style={{ color: '#c3c3cc', fontSize: '13px', lineHeight: 1.5 }}>
                  В ведомости представлены все поступившие работы от студентов группы «{selectedGroup.name}».
                </div>
              ) : notSubmitted.length === 0 ? (
                <div style={{ color: '#c3c3cc', fontSize: '13px' }}>
                  Все студенты учебной группы своевременно предоставили работы по теме.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {notSubmitted.map((st) => (
                    <span key={st.id} style={{ backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', padding: '5px 12px', fontSize: '12px' }}>
                      {st.fullName || `Студент #${st.id}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Submissions ledger */}
        <section style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(112, 112, 125, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c3c3cc', letterSpacing: '0.04em' }}>
                Раздел 02 · Проверка и рецензирование
              </span>
              <h3 style={{ fontSize: '19px', margin: '2px 0 0 0', fontWeight: 500 }}>
                Ведомость работ студентов ({submissions.length})
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'Все работы' },
                { id: 'ON_REVIEW', label: 'На проверке' },
                { id: 'REVIEWED', label: 'Проверено' },
                { id: 'REJECTED', label: 'На доработку' }
              ].map((stTab) => (
                <button
                  key={stTab.id}
                  type="button"
                  onClick={() => setStatusFilter(stTab.id)}
                  style={{
                    backgroundColor: statusFilter === stTab.id ? '#5266eb' : '#272735',
                    color: '#ededf3',
                    border: statusFilter === stTab.id ? '1px solid #5266eb' : '1px solid #70707d',
                    borderRadius: '32px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {stTab.label}
                </button>
              ))}
              <span style={{ backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', padding: '5px 14px', fontSize: '12px', color: '#ededf3' }}>
                Ожидают проверки: <strong>{countSub}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ color: '#c3c3cc', fontSize: '13px' }}>Загрузка ведомости работ...</div>
          ) : submissions.length === 0 ? (
            <div style={{ color: '#c3c3cc', fontSize: '13px', padding: '12px 0' }}>
              По выбранной теме и учебной группе отправленных работ пока не зарегистрировано.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: '#272735',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    border: '1px solid rgba(112, 112, 125, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '15px', color: '#ededf3' }}>
                        {sub.student?.fullName || 'Студент'}
                      </strong>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            backgroundColor: sub.status === 'REVIEWED' ? '#5266eb' : '#1e1e2a',
                            color: '#fff',
                            border: '1px solid rgba(112, 112, 125, 0.35)'
                          }}
                        >
                          {sub.status === 'REVIEWED'
                            ? 'Проверено'
                            : sub.status === 'REJECTED'
                              ? 'На доработку'
                              : 'На проверке'}
                        </span>
                        {sub.isLate && (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              backgroundColor: 'rgba(229, 72, 77, 0.2)',
                              color: '#fca5a5',
                              border: '1px solid rgba(229, 72, 77, 0.4)'
                            }}
                          >
                            Сдано после срока
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#c3c3cc', fontFamily: 'monospace' }}>
                      Файл: {sub.originalFileName}
                    </div>

                    {sub.teacherComment && (
                      <div style={{ marginTop: '10px', fontSize: '13px', color: '#ededf3', backgroundColor: '#1e1e2a', padding: '10px 12px', borderRadius: '8px' }}>
                        <strong style={{ color: '#5266eb' }}>Рецензия преподавателя: </strong>
                        {sub.teacherComment}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(112, 112, 125, 0.18)' }}>
                    <button
                      onClick={() => handleDownload(sub.id)}
                      style={{ backgroundColor: '#1e1e2a', border: '1px solid #70707d', color: '#fff', borderRadius: '32px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Download size={13} /> Скачать
                    </button>
                    <button
                      onClick={() => {
                        setCurrentSubmission(sub);
                        setTeacherReviewComment(sub.teacherComment || '');
                        setReviewStatus(sub.status || 'REVIEWED');
                        setShowReviewModal(true);
                      }}
                      style={{ backgroundColor: '#5266eb', border: 'none', color: '#fff', borderRadius: '32px', padding: '7px 16px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <MessageSquare size={13} /> Выставить рецензию
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODALS */}
      {showCourseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Новый учебный курс</h3>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Название дисциплины *</label>
                <input
                  type="text"
                  placeholder="напр. Архитектура распределенных систем"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Описание курса</label>
                <textarea
                  rows={3}
                  placeholder="Краткое описание..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowCourseModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
                <button type="submit" style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: 'pointer' }}>Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '420px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Привязать группу к курсу</h3>
            <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Выберите учебную группу *</label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="" disabled>-- Выберите группу из списка --</option>
                  {allGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowGroupModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
                <button type="submit" style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: 'pointer' }}>Привязать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTeacherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Добавить преподавателя на курс</h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', margin: '0 0 16px 0', lineHeight: 1.45 }}>
              Выберите коллегу из списка зарегистрированных преподавателей для совместного ведения курса «{selectedCourse?.name}».
            </p>
            <form onSubmit={handleAddCoTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '6px' }}>Выберите преподавателя *</label>
                <select
                  value={coTeacherIdInput}
                  onChange={(e) => setCoTeacherIdInput(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '10px 16px', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                >
                  <option value="" disabled>-- Выберите преподавателя --</option>
                  {allTeachers.map((teacher) => {
                    const alreadyInCourse = getCourseTeachersList(selectedCourse).some(
                      (existing) => Number(existing.id) === Number(teacher.id)
                    );
                    return (
                      <option key={teacher.id} value={teacher.id} disabled={alreadyInCourse}>
                        {teacher.fullName} {teacher.email ? `(${teacher.email})` : ''} {alreadyInCourse ? '— уже на курсе' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddTeacherModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
                <button type="submit" style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: 'pointer' }}>Прикрепить к курсу</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteTopicModal && selectedTopic && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid rgba(229, 72, 77, 0.45)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#ededf3' }}>Удаление темы курса</h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Вы действительно хотите удалить тему <strong style={{ color: '#ededf3' }}>«{selectedTopic.title}»</strong>? Все прикрепленные к ней материалы и сданные работы студентов будут удалены.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowDeleteTopicModal(false)} disabled={deletingTopic} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                disabled={deletingTopic}
                style={{ backgroundColor: '#e5484d', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: deletingTopic ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 500 }}
              >
                {deletingTopic ? 'Удаление...' : 'Подтвердить удаление'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTopicModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Добавить тему к курсу</h3>
            <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Название темы *</label>
                <input
                  type="text"
                  placeholder="напр. Тема 01. Индексация в СУБД"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Тип занятия *</label>
                  <select
                    value={newTopicType}
                    onChange={(e) => {
                      setNewTopicType(e.target.value);
                      setNewTopicAllowSub(e.target.value !== 'LECTURE');
                    }}
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '10px 14px', outline: 'none' }}
                  >
                    <option value="HOMEWORK">Домашнее задание</option>
                    <option value="CLASSWORK">Классная работа</option>
                    <option value="LAB">Лабораторная работа</option>
                    <option value="LECTURE">Лекция / Материал</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Приём работ *</label>
                  <select
                    value={newTopicAllowSub ? 'yes' : 'no'}
                    onChange={(e) => setNewTopicAllowSub(e.target.value === 'yes')}
                    style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '10px 14px', outline: 'none' }}
                  >
                    <option value="yes">Разрешить сдачу</option>
                    <option value="no">Без сдачи работ</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Методические указания</label>
                <textarea
                  rows={3}
                  placeholder="Опишите требования..."
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '8px', color: '#fff', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Ссылки на видеоматериалы (videoUrls)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    style={{ flex: 1, backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '9px 16px', outline: 'none' }}
                  />
                  <button type="button" onClick={handleAddVideoLink} style={{ backgroundColor: '#272735', color: '#ededf3', border: '1px solid #70707d', borderRadius: '32px', padding: '9px 14px', fontSize: '12px', cursor: 'pointer' }}>+ Добавить</button>
                </div>
                {newTopicVideoUrls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                    {newTopicVideoUrls.map((url, idx) => (
                      <div key={idx} style={{ backgroundColor: '#272735', borderRadius: '6px', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }}>{url}</span>
                        <button type="button" onClick={() => setNewTopicVideoUrls((prev) => prev.filter((u) => u !== url))} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Срок сдачи (Дедлайн)</label>
                <input
                  type="datetime-local"
                  value={newTopicDeadline}
                  onChange={(e) => setNewTopicDeadline(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#fff', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowTopicModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
                <button type="submit" style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: 'pointer' }}>Опубликовать тему</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && currentSubmission && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Рецензирование работы</h3>
            <p style={{ fontSize: '13px', color: '#c3c3cc', marginBottom: '16px' }}>{currentSubmission.student?.fullName} ({currentSubmission.originalFileName})</p>
            <form onSubmit={handleSaveReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Статус проверки:</label>
                <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', borderRadius: '32px', padding: '8px 14px' }}>
                  <option value="REVIEWED">Проверено</option>
                  <option value="REJECTED">На доработку</option>
                  <option value="ON_REVIEW">На проверке</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Оценка и рецензия преподавателя:</label>
                <textarea
                  rows={4}
                  value={teacherReviewComment}
                  onChange={(e) => setTeacherReviewComment(e.target.value)}
                  placeholder="Оценка: 5 (Отлично). Задание выполнено..."
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', color: '#ededf3', borderRadius: '8px', padding: '10px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
                <button type="submit" style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: 'pointer' }}>Сохранить рецензию</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(23, 23, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '28px', maxWidth: '460px', width: '100%', border: '1px solid #70707d' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Загрузить учебный материал</h3>
            <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Тема курса *</label>
                <select
                  value={materialTopicId}
                  onChange={(e) => setMaterialTopicId(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px solid #70707d', borderRadius: '32px', color: '#ededf3', padding: '10px 16px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="" disabled>-- Выберите тему --</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c3c3cc', display: 'block', marginBottom: '4px' }}>Файл материала (до 50 МБ) *</label>
                <input
                  type="file"
                  onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                  required
                  style={{ width: '100%', backgroundColor: '#272735', border: '1px dashed #70707d', borderRadius: '12px', color: '#ededf3', padding: '10px', boxSizing: 'border-box', fontSize: '13px' }}
                />
                {materialFile && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#c3c3cc' }}>
                    {materialFile.name} · {(materialFile.size / 1024 / 1024).toFixed(2)} МБ
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowMaterialModal(false)} style={{ background: 'none', border: 'none', color: '#c3c3cc', cursor: 'pointer' }}>Отмена</button>
                <button
                  type="submit"
                  disabled={materialUploading}
                  style={{ backgroundColor: '#5266eb', color: '#fff', border: 'none', borderRadius: '32px', padding: '9px 18px', cursor: materialUploading ? 'wait' : 'pointer', opacity: materialUploading ? 0.7 : 1 }}
                >
                  {materialUploading ? 'Загрузка...' : 'Загрузить файл'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}