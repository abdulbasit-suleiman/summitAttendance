// Import React, useState, useEffect
import React, { useState, useEffect } from "react";
// Import firestore and storage from "@/firebase"
import { firestore, storage } from "@/firebase";

function Dashboard() {
  // Define state variables
  const [user, setUser] = useState(null);
  const [lecturerCodeInput, setLecturerCodeInput] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [lastMarkedDate, setLastMarkedDate] = useState(null);
  const [isProfilePhotoUploaded, setIsProfilePhotoUploaded] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // useEffect to set user state from sessionStorage
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);
  }, []);

  // Handler for lecturer code change
  const handleLecturerCodeChange = (e) => {
    setLecturerCodeInput(e.target.value.toUpperCase());
  };

  // Function to verify lecturer code
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
        setCourseTitle(courseData.title);
      } else {
        alert("Course not found!");
        setLecturerName("");
        setCourseTitle("");
      }
    } catch (error) {
      console.error("Error verifying lecturer code:", error);
      alert("Error verifying lecturer code. Please try again later.");
    }
  };

  // Function to mark attendance
  const markAttendance = async () => {
    try {
      if (!lecturerName || !courseTitle) {
        alert("Please verify lecturer and course first.");
        return;
      }

      const { matricNo, name } = user;
      const sanitizedMatricNo = matricNo.replace(/[.#$/[\]]/g, "_");
      const markedAt = new Date().toISOString();

      const coursesRef = firestore.collection("courses");
      const querySnapshot = await coursesRef
        .where("lecturerName", "==", lecturerName)
        .where("title", "==", courseTitle)
        .get();

      if (!querySnapshot.empty) {
        const courseDocId = querySnapshot.docs[0].id;

        const courseDocRef = firestore.collection("courses").doc(courseDocId);
        const courseDoc = await courseDocRef.get();
        const attendance = courseDoc.data().attendance || {};

        const markedDate = markedAt.split("T")[0];
        if (attendance[`${sanitizedMatricNo}_${courseTitle}`]?.date === markedDate) {
          alert("Attendance already marked for today!");
          return;
        }

        const attendanceRecord = {
          matricNo: matricNo,
          name: name,
          date: markedDate,
          time: markedAt.split("T")[1].split(".")[0],
        };

        await courseDocRef.update({
          [`attendance.${sanitizedMatricNo}_${courseTitle}`]: attendanceRecord,
        });

        setIsAttendanceMarked(true);
        setLastMarkedDate(markedDate);

        setMarkedAttendance((prevState) => ({
          ...prevState,
          [courseTitle]: attendanceRecord,
        }));

        alert("Attendance marked successfully!");
      } else {
        alert("Course not found!");
        setLecturerName("");
        setCourseTitle("");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance. Please try again later.");
    }
  };

  // useEffect to fetch profile photo when component mounts
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);
    fetchProfilePhoto(userData.matricNo);
  }, []);

  // Function to fetch profile photo
  const fetchProfilePhoto = async (matricNo) => {
    try {
      const profilePhotoRef = storage.ref().child(`profile_photos/${matricNo}`);
      const url = await profilePhotoRef.getDownloadURL();
      setProfilePhotoURL(url);
      setIsProfilePhotoUploaded(true);
    } catch (error) {
      console.error("Error fetching profile photo:", error);
      setIsProfilePhotoUploaded(false);
    }
  };

  // Handler for profile photo change
  const handleProfilePhotoChange = (e) => {
    // Show alert when user clicks on "Choose file"
    alert('Ensure that you are taking a clear picture of yourself  or you may not be able to mark attendance ');
    
    // After user clicks OK, allow them to select a file
    const photo = e.target.files[0];
    setProfilePhoto(photo);
  };

  // Function to save profile photo
  const saveProfilePhoto = async () => {
    try {
      if (!profilePhoto) {
        alert("Please select a Clear photo of yours.");
        return;
      }
  
      const storageRef = storage.ref();
      const photoRef = storageRef.child(`profile_photos/${user.matricNo}`);
      await photoRef.put(profilePhoto);
  
      alert("Profile photo saved successfully!");
      setProfilePhotoURL(await photoRef.getDownloadURL());
      setIsProfilePhotoUploaded(true);
    } catch (error) {
      console.error("Error saving profile photo:", error);
      alert("Error saving profile photo. Please try again later.");
    }
  };

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Student Dashboard</h2>
      {user && (
        <div className="dashboard-content">
          <div className="profile-section">
            {profilePhotoURL && (
              <div className="profile-photo-preview">
                <img src={profilePhotoURL} alt="Profile" width={100} height={100} style={{ borderRadius: "50%" }} />
              </div>
            )}
            <div className="profile-info">
              <span className="welcome">
                <h2>Welcome, {user.name}</h2>
              </span>
              <p className="user-info">{user.matricNo}</p>
              <div className="user-details">
                <p>Email: {user.email}</p>
                <p>College: {user.college}</p>
                <p>Department: {user.department}</p>
              </div>
            </div>
          </div>

          <div className="verify-course">
            <input
              type="text"
              value={lecturerCodeInput}
              onChange={handleLecturerCodeChange}
              placeholder="Enter course code"
            />
            <button onClick={verifyLecturerCode}>Verify Course</button>
          </div>

          {lecturerName && (
            <div className="course-details">
              <h3>Lecturer: {lecturerName}</h3>
              <h3>Course Title: {courseTitle}</h3>
              <button onClick={markAttendance}>Mark Attendance</button>
            </div>
          )}

          {isAttendanceMarked && (
            <div className="marked-attendance">
              <h3>Marked Attendance:</h3>
              <ul>
                {Object.keys(markedAttendance).map((key, index) => (
                  <li key={index}>
                    <p>Matric No: {markedAttendance[key].matricNo}</p>
                    <p>Name: {markedAttendance[key].name}</p>
                    <p>Date: {markedAttendance[key].date}</p>
                    <p>Time: {markedAttendance[key].time}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!isProfilePhotoUploaded && (
            <div className="profile-photo">
              <input type="file" accept="image/*" onChange={handleProfilePhotoChange} />
              <button onClick={saveProfilePhoto}>Save Facial Photo</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
