import React from 'react';
import './AIDrawer.css';

/**
 * AIDrawer Component
 *
 * Persistently mounted side-drawer component. Controlled via CSS status classes (.open)
 * to ensure smooth slide-in and slide-out transitions without abrupt React unmounting.
 *
 * @param {boolean} isOpen - Controls visibility and CSS slide state
 * @param {function} onClose - Callback invoked when close button or backdrop is clicked
 * @param {React.ReactNode} children - Drawer body content
 */
const AIDrawer = ({ isOpen, onClose, children }) => {
  return (
    <div
      className={`ai-drawer-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className="ai-drawer-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="ai-drawer-header">
          <div className="ai-drawer-title-group">
            <span className="ai-drawer-title-icon">🤖</span>
            <div>
              <h3 className="ai-drawer-title">AI Study Assistant</h3>
              <span className="ai-drawer-subtitle">Career Launchpad Developer Tool</span>
            </div>
          </div>
          <button
            type="button"
            className="ai-drawer-close-btn"
            onClick={onClose}
            title="Close Assistant Drawer"
            aria-label="Close Assistant Drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="ai-drawer-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AIDrawer;
