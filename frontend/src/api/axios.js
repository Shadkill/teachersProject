import axios from 'axios';

// Базовый клиент для сервера на порту 5000
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Перехватчик запросов: автоматически добавляет JWT токен из localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('abitsherpa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Словарь статусов: под капотом строгие enum для Prisma, в интерфейсе — понятный русский язык
export const STATUS_LABELS = {
  ON_REVIEW: 'На проверке',
  REVIEWED: 'Проверено',
  REJECTED: 'На доработку',
};

export const TOPIC_TYPE_LABELS = {
  LECTURE: 'Лекция',
  CLASSWORK: 'Классная работа',
  HOMEWORK: 'Домашнее задание',
  LAB: 'Лабораторная работа',
};

export default api;