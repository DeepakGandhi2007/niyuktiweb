import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Banner from "./pages/Banner";
import Login from "./pages/Login";
import Course from "./pages/Course";
import AddCourse from "./pages/course/AddCourse";
import EditCourse from "./pages/course/EditCourse";
import ProtectedRoute from "./components/ProtectedRoute";
import Categories from "./pages/Category";
import FileManagerPage from "./components/FileManager";
import Test from "./pages/Test/Index";
import AddTest from "./pages/Test/add";
import EditTest from "./pages/Test/EditTest";
import TestCategories from "./pages/TestCategory";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/banner" element={<Banner />} />
             <Route path="/category" element={<Categories />} />
            <Route path="/test-category" element={<TestCategories />} />
            <Route path="/course" element={<Course />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/course/add" element={<AddCourse />} />
            <Route path="/mock-test" element={<Test />} />
             <Route path="/test/add" element={<AddTest />} />
             <Route path="/test/edit/:id" element={<EditTest />} />
            <Route path="/course/edit/:id" element={<EditCourse />} />
            <Route path="/file-manager" element={<FileManagerPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
