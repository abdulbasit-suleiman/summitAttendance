import React, { useState, useEffect } from "react";
import { firestore } from "@/firebase";

function LecturerDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [courseTitleInput, setCourseTitleInput] = useState("");
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);

    if (userData) {
      fetchCourses(userData.name);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCourses(user.name);
    }
  }, [user]);

  const fetchCourses = async (lecturerName) => {
    try {
      if (!lecturerName) {
        return;
      }

      const coursesRef = firestore.collection("courses").where("lecturerName", "==", lecturerName);
      const snapshot = await coursesRef.get();
      const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(fetchedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Error fetching courses. Please try again later.");
    }
  };

  const handleInputChange = (e) => {
    let inputValue = e.target.value.toUpperCase();
    inputValue = inputValue.replace(/[^A-Z0-9]/g, "");
    if (inputValue.length <= 6) {
      setNewCourse(inputValue);
    }
  };

  const generateUniqueCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const saveCourse = async () => {
    if (newCourse.trim() !== "") {
      const existingCourse = courses.find(c => c.title === newCourse);
      if (existingCourse) {
        alert("Error: A course with the same title already exists. Please choose a different title.");
        return;
      }

      const uniqueCode = generateUniqueCode();

      const courseRef = firestore.collection("courses").doc();
      await courseRef.set({
        title: newCourse,
        lecturerName: user.name,
        uniqueCode: uniqueCode,
        attendance: [],
      });

      fetchCourses(user.name);
      setNewCourse("");
    }
  };

  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setIsFetchingAttendance(true); // Set loading indicator to true
    
    try {
        const courseRef = firestore.collection("courses").doc(course.id); // Assuming course.id exists
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            throw new Error("Course document not found");
        }

        const courseData = courseDoc.data();

        if (!courseData.attendance || !Array.isArray(courseData.attendance)) {
            setAttendanceRecords([]); // No attendance records found, set empty array
        } else {
            setAttendanceRecords(courseData.attendance); // Set attendance records
        }
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        alert("Error fetching attendance records. Please try again later.");
    } finally {
        setIsFetchingAttendance(false); // Set loading indicator to false
    }
};


  const handleCourseTitleInput = (e) => {
    setCourseTitleInput(e.target.value.toUpperCase());
  };
  const fetchAttendanceRecords = async () => {
    setIsFetchingAttendance(true); // Set loading indicator to true
    try {
        if (!courseTitleInput) {
            alert("Please enter a course title.");
            return;
        }

        const courseRef = firestore.collection("courses").where("title", "==", courseTitleInput);
        const snapshot = await courseRef.get();

        if (snapshot.empty) {
            alert("No course found with the provided title.");
            return;
        }

        const courseDoc = snapshot.docs[0];
        const courseData = courseDoc.data();

        if (!courseData.attendance || !Array.isArray(courseData.attendance) || courseData.attendance.length === 0) {
            alert("No attendance records found for this course.");
            return;
        }

        setAttendanceRecords(courseData.attendance); // Set attendance records
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        alert("Error fetching attendance records. Please try again later.");
    } finally {
        setIsFetchingAttendance(false); // Set loading indicator to false
    }
};

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Lecturer Dashboard</h2>
      {user && (
        <div className="dashboard-content">
          <span className="welcome">
            <h2>Welcome, {user.name}</h2>
          </span>
          <div className="user-info">
            <p>Email: {user.email}</p>
            <p>College: {user.college}</p>
            <p>Department: {user.department}</p>
          </div>
        
          <div className="add-course">
            <h3>Add Course</h3>
            <input
              type="text"
              value={newCourse}
              onChange={handleInputChange}
              placeholder="Enter course title (e.g., ABC123)"
              maxLength="6"
            />
            <button onClick={saveCourse}>Add</button>
          </div>
  
          <div className="fetch-attendance">
            <h3>Fetch Attendance by Course Title</h3>
            <input
              type="text"
              value={courseTitleInput}
              onChange={handleCourseTitleInput}
              placeholder="Enter course title"
            />
            <button onClick={fetchAttendanceRecords}>Fetch</button>
          </div>
  
          {isFetchingAttendance && <p className="loading-message">Fetching attendance records...</p>}
  
          {attendanceRecords.length > 0 && (
            <div className="attendance-records">
              <h3>Attendance Records</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Matriculation Number</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{record.name}</td>
                      <td>{record.matricNo}</td>
                      <td>{record.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
  
          {courses.length > 0 && (
            <div className="added-courses">
              <h3>Added Courses</h3>
              <ul>
                {courses.map((course, index) => (
                  <li key={index} onClick={() => handleCourseClick(course)}>
                    {course.title} - Unique Code: {course.uniqueCode}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );}
  

export default LecturerDashboard;
