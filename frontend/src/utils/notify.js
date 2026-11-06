import toast from 'react-hot-toast';

const mercuryToastStyle = {
  background: '#1e1e2a',
  color: '#ededf3',
  border: '1px solid rgba(226, 227, 237, 0.2)',
  borderRadius: '12px',
  padding: '14px 18px',
  fontSize: '14px',
  fontWeight: 400,
  boxShadow: 'none',
};

export const notifySuccess = (message) =>
  toast.success(message, {
    style: mercuryToastStyle,
    iconTheme: {
      primary: '#5266eb',
      secondary: '#ffffff',
    },
  });

export const notifyError = (message) =>
  toast.error(message, {
    style: {
      ...mercuryToastStyle,
      border: '1px solid rgba(237, 237, 243, 0.45)',
    },
    iconTheme: {
      primary: '#ededf3',
      secondary: '#1e1e2a',
    },
  });