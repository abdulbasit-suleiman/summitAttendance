import { useState, useEffect } from "react";
import { firestore } from "@/firebase";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isImageSaved, setIsImageSaved] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState("");
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    // Retrieve user data from session
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setIsImageSaved(false); // Reset flag when a new image is selected
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const updateProfileImage = () => {
    setUser((prevUser) => ({
      ...prevUser,
      profileImage: profileImage,
    }));
    setIsImageSaved(true); // Set flag to indicate image is saved
    // You may also want to update the sessionStorage here to persist the changes
  };

  const handleCourseIdChange = (e) => {
    setCourseIdInput(e.target.value.toUpperCase()); // Convert to uppercase
  };

  const fetchCourseDetails = async () => {
    try {
      const courseRef = firestore.collection("courses").doc(courseIdInput);
      const doc = await courseRef.get();
      if (doc.exists) {
        setCourseDetails(doc.data());
      } else {
        alert("Course not found!");
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      alert("Error fetching course details. Please try again later.");
    }
  };

  const markAttendance = async () => {
    try {
      const attendanceRef = firestore.collection("attendancesheets").doc(courseIdInput);
      const attendanceDoc = await attendanceRef.get();
      if (attendanceDoc.exists) {
        // Add code to mark attendance for the current user
        alert("Attendance marked successfully!");
      } else {
        alert("Attendance sheet not found for this course!");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance. Please try again later.");
    }
  };

  return (
    <div className="dashboard">
      <h2>Student Dashboard</h2>
      {user && (
        <div className="dashboardPage">
          <span className="welcome">
            <p style={{ display: "flex", gap: "3rem", color: "green" }}>
              <div className="profile photo">
                {profileImage && (
                  <div>
                    <img
                      src={profileImage}
                      alt="Profile"
                      style={{ borderRadius: "50px", width: "100px", height: "100px" }}
                    />
                    {!isImageSaved && <button onClick={updateProfileImage}>Save Profile Image</button>}
                  </div>
                )}
                {!profileImage && (
                  <div>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </div>
                )}
              </div>
              <h2 style={{}}>{user.name}</h2>
            </p>
          </span>

          <p> {user.matricNo}</p>
          <p>Email: {user.email}</p>
          <p>college: {user.college}</p>
          <p>department: {user.department}</p>

          <div>
            <input
              type="text"
              value={courseIdInput}
              onChange={handleCourseIdChange}
              placeholder="Enter course ID"
            />
            <button onClick={fetchCourseDetails}>Fetch Course Details</button>
          </div>

          {courseDetails && (
            <div>
              <h3>Course Details:</h3>
              <p>Title: {courseDetails.title}</p>
              <p>Lecturer: {courseDetails.lecturerName}</p>
              <button onClick={markAttendance}>Mark Attendance</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
