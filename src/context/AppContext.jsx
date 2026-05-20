import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { name: 'Abduxoshim Sultonqulov', photo: '' };
  });

  const [darkMode, setDarkMode] = useState(() => {
    const savedDark = localStorage.getItem('darkMode');
    return savedDark ? JSON.parse(savedDark) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const [teachers, setTeachers] = useState(() => {
    const savedTeachers = localStorage.getItem('teachers');
    return savedTeachers ? JSON.parse(savedTeachers) : [
      { id: 1, name: 'Mohirbek', group: 'N26 n105', phone: '+998944481309', email: 'mohirbek@gmail.com', address: 'Tashkent', createdAt: '12.05.2026' }
    ];
  });

  const [groups, setGroups] = useState(() => {
    const savedGroups = localStorage.getItem('groups');
    return savedGroups ? JSON.parse(savedGroups) : [
      { id: 1, active: true, name: 'N26', course: 'Backend', duration: '6 oy', time: '09:30', room: 'Autodesk', teacher: 'Mohirbek', students: 1 },
      { id: 2, active: true, name: 'n105', course: 'Backend', duration: '6 oy', time: '16:00', room: 'Autodesk', teacher: 'Mohirbek', students: 1 }
    ];
  });

  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem('students');
    return savedStudents ? JSON.parse(savedStudents) : [];
  });

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  const updateUser = (data) => setUser({ ...user, ...data });

  const addTeacher = (teacher) => setTeachers([...teachers, { ...teacher, id: Date.now(), createdAt: new Date().toLocaleDateString() }]);
  const deleteTeacher = (id) => setTeachers(teachers.filter(t => t.id !== id));

  const addGroup = (group) => setGroups([...groups, { ...group, id: Date.now() }]);
  const deleteGroup = (id) => setGroups(groups.filter(g => g.id !== id));
  
  const toggleGroupStatus = (id) => {
    setGroups(groups.map(group => 
      group.id === id ? { ...group, active: !group.active } : group
    ));
  };

  const addStudent = (student) => {
    setStudents([...students, { ...student, id: Date.now(), createdAt: new Date().toLocaleDateString() }]);
  };
  const deleteStudent = (id) => setStudents(students.filter(s => s.id !== id));

  return (
    <AppContext.Provider value={{ 
      user, updateUser, 
      darkMode, toggleDarkMode,
      teachers, addTeacher, deleteTeacher,
      groups, addGroup, deleteGroup, toggleGroupStatus,
      students, addStudent, deleteStudent
    }}>
      {children}
    </AppContext.Provider>
  );
};
