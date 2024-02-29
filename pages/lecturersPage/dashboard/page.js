import React, { useState, useEffect } from "react";
import { firestore } from "@/firebase";

function LecturerDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentMatricNo, setNewStudentMatricNo] = useState("");
  const [newDate, setNewDate] = useState("");

  // Fetch courses upon initial render and user change
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
  
      // Generate a unique code before setting the document
      const uniqueCode = generateUniqueCode();
  
      const courseRef = firestore.collection("courses").doc();
      await courseRef.set({
        title: newCourse,
        lecturerName: user.name,
        uniqueCode: uniqueCode, // Ensure uniqueCode is set before saving
        attendance: [], // Initialize empty attendance sheet
      });
  
      fetchCourses(user.name);
      setNewCourse("");
    }
  };
  
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setAttendanceRecords(course.attendance || []);
    // Clear student input fields when selecting a course
    setNewStudentName("");
    setNewStudentMatricNo("");
    setNewDate("");
  };

  const handleAddStudent = async () => {
    if (newStudentName.trim() === "" || newStudentMatricNo.trim() === "") {
      alert("Please enter both name and matriculation number.");
      return;
    }

    const updatedAttendance = [...attendanceRecords, { name: newStudentName, matricNo: newStudentMatricNo }];

    // Update course document with updated attendance list
    await firestore.collection("courses").doc(selectedCourse.id).update({ attendance: updatedAttendance });

    setAttendanceRecords(updatedAttendance);
    setNewStudentName(""); // Clear name field after adding
    setNewStudentMatricNo(""); // Clear matriculation number field after adding
    setNewDate(""); // Clear matriculation number field after adding
  };

  return (
    <div className="dashboard">
      <h2>Lecturer Dashboard</h2>
      {user && (
        <div className="dashboardPage">
          <span className="welcome">
            <h2>{user.name}</h2>
          </span>
          <p>Email: {user.email}</p>
          <p>College: {user.college}</p>
          <p>Department: {user.department}</p>
  
          {/* Add course section */}
          <div>
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
  
          {/* Added courses and attendance section */}
          {courses.length > 0 && (
            <div>
              <h3>Added Courses</h3>
              <ul>
                {courses.map((course, index) => (
                  <li key={index} onClick={() => handleCourseClick(course)}>
                    {course.title} - Unique Code: {course.uniqueCode}
                    {selectedCourse && selectedCourse.id === course.id && (
                      <div>
                        {/* Attendance sheet for selected course */}
                        <p>Attendance Records for {course.title}</p>
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Matriculation Number</th>
                              {/* Add date column */}
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRecords.map((record, idx) => (
                              <tr key={idx}>
                                <td>{record.name}</td>
                                <td>{record.matricNo}</td>
                                <td>{record.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
  
                        {/* Add student form */}
                        <div>
                          <input
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="Name will be here"
                          />
                          
                          <input
                            type="text"
                            value={newStudentMatricNo}
                            onChange={(e) => setNewStudentMatricNo(e.target.value)}
                            placeholder="MatricNo  will be here"
                          />
                          <input
                            type="text"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            placeholder="Date will be here "
                          />
                          <button onClick={handleAddStudent}>Add Student</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LecturerDashboard;
