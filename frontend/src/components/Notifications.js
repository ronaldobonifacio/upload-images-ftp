import React from 'react';
import { FiInfo } from 'react-icons/fi';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';

const Notification = ({ message, type, onClose }) => {
  const icons = {
    success: <FaCheckCircle />,
    error: <FaExclamationCircle />,
    warning: <FaExclamationTriangle />,
    info: <FiInfo />
  };

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        {icons[type] || icons.info}
        <span>{message}</span>
      </div>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
};

export default Notification;