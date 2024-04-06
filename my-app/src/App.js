import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ActiveTabProvider, useActiveTab } from './pages/ActiveTabContext'; // Adjust the import path as necessary
import TabNavigation from './pages/TabNavigation';
import RoomListPage from './pages/RoomListPage';
import ManualJoin from './pages/ManualJoin';
import CreateRoom from './pages/CreateRoom';
import WelcomePage from './pages/WelcomePage';
import './App.css';

const App = () => {
  return (
    <Router>
      <ActiveTabProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/rooms" element={<RoomListPageWrapper />} />
          <Route path="/manual-join" element={<ManualJoinWrapper />} />
          <Route path="/create-room" element={<CreateRoomWrapper />} />
        </Routes>
      </ActiveTabProvider>
    </Router>
  );
};

// Components that render the pages with TabNavigation
const RoomListPageWrapper = () => <PageWithTabs><RoomListPage /></PageWithTabs>;
const ManualJoinWrapper = () => <PageWithTabs><ManualJoin /></PageWithTabs>;
const CreateRoomWrapper = () => <PageWithTabs><CreateRoom /></PageWithTabs>;

// Component to render TabNavigation and the current page
const PageWithTabs = ({ children }) => {
  const { activeTab, setActiveTab } = useActiveTab();

  // Optionally, use useEffect here to set the active tab based on the current route
  // This assumes TabNavigation allows for an `setActiveTab` prop to change the active state
  return (
    <>
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {children}
    </>
  );
};

export default App;
