import React, { useState, useEffect } from "react";
import { firestore } from "@/firebase";

function LecturerDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [courseTitleInput, setCourseTitleInput] = useState("");
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);
  const [newCourse, setNewCourse] = useState("");

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
    
      let uniqueCode = generateUniqueCode();
      const courseRef = firestore.collection("courses").doc();
      const attendanceRef = firestore.collection("attendance").doc(); // Add attendance collection reference
  
      // Create a new attendance sheet
      const attendanceData = {
        courseTitle: newCourse,
        lecturerName: user.name,
        attendance: [], // Assuming you have an array of attendance records here
      };
  
      await attendanceRef.set(attendanceData);
  
      // Create the course
      await courseRef.set({
        title: newCourse,
        lecturerName: user.name,
        uniqueCode: uniqueCode,
        attendanceSheetId: attendanceRef.id, // Store the attendance sheet ID with the course
      });
  
      fetchCourses(user.name);
      setNewCourse("");
  
      const updateUniqueCode = async () => {
        const updatedCourseRef = firestore.collection("courses").doc(courseRef.id);
  
        let updatedUniqueCode = generateUniqueCode();
        while (updatedUniqueCode === uniqueCode) {
          updatedUniqueCode = generateUniqueCode(); // Ensure the new code is different from the previous one
        }
  
        await updatedCourseRef.update({
          uniqueCode: updatedUniqueCode,
        });
  
        fetchCourses(user.name);
  
        // Schedule the next update after 3 minutes
        setTimeout(updateUniqueCode, 2 * 60 * 1000); // 3 minutes in milliseconds
      };
  
      // Schedule the first update after 3 minutes
      setTimeout(updateUniqueCode, 2 * 60 * 1000); // 3 minutes in milliseconds
    }
  };
  

  const handleCourseClick = async (course) => {
    setSelectedCourse(course);
    setIsFetchingAttendance(true); // Set loading indicator to true
    
    try {
      await fetchAttendanceRecords(course.title);
    } finally {
      setIsFetchingAttendance(false); // Set loading indicator to false
    }
  };
  
  
  const handleCourseTitleInput = (e) => {
    setCourseTitleInput(e.target.value.toUpperCase());
  };

  const fetchAttendanceRecords = async (courseTitle) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }
  
    setIsFetchingAttendance(true); // Set loading indicator to true
    try {
      // Retrieve course information directly from markAttendance's logic
      const coursesRef = firestore.collection("courses");
      const querySnapshot = await coursesRef
        .where("lecturerName", "==", user.name)
        .where("title", "==", courseTitle) // No toUpperCase() call
        .get();
  
      if (querySnapshot.empty) {
        alert("No course found with the specified title.");
        return;
      }
  
      const courseDoc = querySnapshot.docs[0];
      const attendanceRef = courseDoc.ref.collection("attendance");
  
      // Fetch attendance records directly from the course's attendance subcollection
      const attendanceSnapshot = await attendanceRef.get();
  
      if (attendanceSnapshot.empty) {
        setAttendanceRecords([]); // 
        return;
      }
  
      const attendanceArray = attendanceSnapshot.docs.map(doc => ({
        matricNo: doc.data().matricNo,
        name: doc.data().name,
        date: doc.data().date,
        time: doc.data().time,
        presence: doc.data().presence || 0, // Retrieve presence count
      }));
  
      setAttendanceRecords(attendanceArray); // Set attendance records
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      alert("Error fetching attendance records. Please try again later.");
    } finally {
      setIsFetchingAttendance(false); // Set loading indicator to false
    }
  };
  
  
  // Function to download the attendance sheet
  const downloadAttendanceSheet = () => {
    // Convert attendanceRecords to CSV format
    const csv = attendanceRecords.map(record => `${record.name},${record.matricNo},${record.date},${record.time}`).join("\n");
    // Create a blob from the CSV data
    const blob = new Blob([csv], { type: "text/csv" });
    // Create a download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "attendance_sheet.csv";
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Lecturer Dashboard</h2>
      {user && (
        <div className="dashboard-content">
          <span className="welcome">
            <h2>Welcome, {user.name}</h2>
          </span>
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
            <button onClick={() => fetchAttendanceRecords(courseTitleInput)}>Fetch</button>
          </div>

          {isFetchingAttendance && <p className="loading-message">Fetching attendance records...</p>}
          {attendanceRecords.length > 0 && (
            <div className="attendance-records">
              <h3>Attendance Records for {courseTitleInput}</h3>
              <button onClick={downloadAttendanceSheet}>Download Attendance Sheet</button>
              <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Matriculation Number</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Presence</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{record.name}</td>
                    <td>{record.matricNo}</td>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td>{record.presence}</td> {/* Display presence count */}
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
                  <li key={index}>
                    {course.title} - Unique Code: {course.uniqueCode}
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
