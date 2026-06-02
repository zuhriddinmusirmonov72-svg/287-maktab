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
import GroupLesson from './pages/GroupLesson';
import HomeworkSubmit from './pages/HomeworkSubmit';
import HomeworkOwn from './pages/HomeworkOwn';
import HomeworkAll from './pages/HomeworkAll';
import Layout from './components/Layout';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<GroupDetails />} />
            <Route path="/groups/:groupId/lesson/:date" element={<GroupLesson />} />
            <Route path="/homework/:homeworkId/submit" element={<HomeworkSubmit />} />
            <Route path="/lesson/:lessonId/homework" element={<HomeworkOwn />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/students" element={<Students />} />
            <Route path="/homework" element={<HomeworkAll />} />
            <Route path="/management" element={<Management />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
