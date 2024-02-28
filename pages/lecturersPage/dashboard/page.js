import { useState, useEffect } from "react";
import { firestore } from "@/firebase";

function LecturerDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState("");

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);

    // Fetch courses only if user data is available
    if (userData) {
      fetchCourses(userData.name);
    }
  }, []);

  useEffect(() => {
    // Fetch courses again if user changes
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

  const saveCourse = async () => {
    if (newCourse.trim() !== "") {
      const existingCourse = courses.find(c => c.title === newCourse);
      if (existingCourse) {
        alert("Error: A course with the same title already exists. Please choose a different title.");
        return;
      }

      const courseRef = firestore.collection("courses").doc(); 
      await courseRef.set({
        title: newCourse,
        lecturerName: user.name,
      });

      // Fetch courses again after saving to update the list
      fetchCourses(user.name);
      setNewCourse("");
    }
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

          {courses.length > 0 && (
            <div>
              <h3>Added Courses</h3>
              <ul>
                {courses.map((course, index) => (
                  <li key={index}>{course.title}</li>
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
