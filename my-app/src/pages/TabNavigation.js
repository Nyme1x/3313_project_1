import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './../css/TabNavigation.css';

const TabNavigation = () => {
  const location = useLocation();
  const [underlineStyle, setUnderlineStyle] = useState({});
  const tabs = [
    { name: 'Join a Room', path: '/rooms' },
    { name: 'Manual Join', path: '/manual-join' },
    { name: 'Create a Room', path: '/create-room' },
  ];

  // Calculate and update the underline position when the pathname changes
  useEffect(() => {
    const currentTab = tabs.findIndex(tab => tab.path === location.pathname);
    const percentage = (100 / tabs.length) * currentTab;
    setUnderlineStyle({
      left: `${percentage}%`,
      width: `${100 / tabs.length}%`,
      transition: 'left 0.3s ease-out', // This makes the slide effect
    });
  }, [location, tabs.length]);

  return (
    <div className="tabs-container">
      {tabs.map((tab, index) => (
        <NavLink
          key={index}
          to={tab.path}
          className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
        >
          {tab.name}
        </NavLink>
      ))}
      <div className="underline" style={underlineStyle} />
    </div>
  );
};

export default TabNavigation;
