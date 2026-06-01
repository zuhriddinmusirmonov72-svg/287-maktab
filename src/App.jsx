import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Groups from './pages/Groups';
import Management from './pages/Management';
import Profile from './pages/Profile';
import Courses from './pages/Courses';
import Rooms from './pages/Rooms';
import Students from './pages/Students';
import GroupDetails from './pages/GroupDetails';
import HomeworkSubmit from './pages/HomeworkSubmit';
import Layout from './components/Layout';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupDetails />} />
            <Route path="homework/:homeworkId/submit" element={<HomeworkSubmit />} />
            <Route path="courses" element={<Courses />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="students" element={<Students />} />
              <Route path="management" element={<Management />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;