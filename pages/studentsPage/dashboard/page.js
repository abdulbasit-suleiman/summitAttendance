import React, { useState, useEffect } from "react";
import { firestore } from "@/firebase";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isImageSaved, setIsImageSaved] = useState(false);
  const [lecturerCodeInput, setLecturerCodeInput] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setIsImageSaved(false);
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
    setIsImageSaved(true);
    // Update session storage here if needed
  };

  const handleLecturerCodeChange = (e) => {
    setLecturerCodeInput(e.target.value.toUpperCase());
  };


  const verifyLecturerCode = async () => {
    try {
      if (!lecturerCodeInput) {
        alert("Please enter a lecturer code.");
        return;
      }
  
      const coursesRef = firestore.collection("courses");
      const querySnapshot = await coursesRef.where("uniqueCode", "==", lecturerCodeInput).get();
  
      if (!querySnapshot.empty) {
        const courseData = querySnapshot.docs[0].data();
        setLecturerName(courseData.lecturerName);
      } else {
        alert("Course not found!");
        setLecturerName("");
      }
    } catch (error) {
      console.error("Error verifying lecturer code:", error);
      alert("Error verifying lecturer code. Please try again later.");
    }
  };
  
  
  
  
  

  const markAttendance = async () => {
    try {
      if (!lecturerName || !attendanceDate) {
        alert("Please verify lecturer and select date first.");
        return;
      }

      // Update attendance sheet in Firebase
      const attendanceRef = firestore.collection("attendance").doc(lecturerName);
      await attendanceRef.update({
        [user.matricNo]: {
          date: attendanceDate,
        },
      });

      setIsAttendanceMarked(true);
      alert("Attendance marked successfully!");
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance. Please try again later.");
    }
  };

  const handleDateChange = (e) => {
    setAttendanceDate(e.target.value);
  };

  return (
    <div className="dashboard">
      <h2>Student Dashboard</h2>
      {user && (
        <div className="dashboardPage">
          <span className="welcome">
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
          </span>

          <p> {user.matricNo}</p>
          <p>Email: {user.email}</p>
          <p>College: {user.college}</p>
          <p>Department: {user.department}</p>

          <div>
            <input
              type="text"
              value={lecturerCodeInput}
              onChange={handleLecturerCodeChange}
              placeholder="Enter lecturer code"
            />
            <button onClick={verifyLecturerCode}>Verify Lecturer</button>
          </div>

          {lecturerName && (
            <div>
              <h3>Lecturer: {lecturerName}</h3>
              <div>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={handleDateChange}
                  placeholder="Select Date"
                />
                <button onClick={markAttendance}>Mark Attendance</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
