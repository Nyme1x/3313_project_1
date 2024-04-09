import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ActiveTabProvider, useActiveTab } from './pages/ActiveTabContext'; // Adjust the import path as necessary
import TabNavigation from './pages/TabNavigation';
import RoomListPage from './pages/RoomListPage';
import ManualJoin from './pages/ManualJoin';
import CreateRoom from './pages/CreateRoom';
import WelcomePage from './pages/WelcomePage';
import Chatting from './pages/Chatting';
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
          <Route path="/chat/:roomCode" element={<Chatting />} />
        </Routes>
      </ActiveTabProvider>
    </Router>
  );
};

const RoomListPageWrapper = () => <PageWithTabs><RoomListPage /></PageWithTabs>;
const ManualJoinWrapper = () => <PageWithTabs><ManualJoin /></PageWithTabs>;
const CreateRoomWrapper = () => <PageWithTabs><CreateRoom /></PageWithTabs>;

const PageWithTabs = ({ children }) => {
  const { activeTab, setActiveTab } = useActiveTab();
  return (
    <>
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {children}
    </>
  );
};

export default App;
