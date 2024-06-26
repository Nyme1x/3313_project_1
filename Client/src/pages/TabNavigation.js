import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './../css/TabNavigation.css';

const TabNavigation = () => {
  const location = useLocation();
  const [underlineStyle, setUnderlineStyle] = useState({});
  const tabRefs = useRef([]);

  const tabs = [
    { name: 'Join a Room', path: '/rooms' },
    { name: 'Manual Join', path: '/manual-join' },
    { name: 'Create a Room', path: '/create-room' },
  ];

  useEffect(() => {
    const findActiveTab = () => {
      return tabRefs.current.find(tab => tab && tab.getAttribute('href') === location.pathname);
    };

    const updateUnderline = () => {
      const activeTab = findActiveTab();
      if (activeTab) {
        const width = activeTab.offsetWidth;
        const left = activeTab.offsetLeft;
        setUnderlineStyle({
          left: `${left}px`,
          width: `${width}px`,
          transition: 'left 0.3s ease-out, width 0.3s ease-out',
        });
      }
    };
    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [location]);

  return (
    <div className="tabs-container">
      {tabs.map((tab, index) => (
        <NavLink
          key={index}
          to={tab.path}
          className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          ref={el => tabRefs.current[index] = el}
        >
          {tab.name}
        </NavLink>
      ))}
      <div className="underline" style={underlineStyle} />
    </div>
  );
};

export default TabNavigation;
