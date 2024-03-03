import React, { useState, useEffect } from "react";
import { firestore, storage } from "@/firebase";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [lecturerCodeInput, setLecturerCodeInput] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [lastMarkedDate, setLastMarkedDate] = useState(null);
  const [markedAttendance, setMarkedAttendance] = useState([]);
  const [isProfilePhotoUploaded, setIsProfilePhotoUploaded] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [fetchedAttendance, setFetchedAttendance] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);
  }, []);

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
      const querySnapshot = await coursesRef
        .where("uniqueCode", "==", lecturerCodeInput)
        .get();

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

  const markAttendance = async () => {
    try {
      if (!lecturerName || !courseTitle) {
        alert("Please verify lecturer and course first.");
        return;
      }

      const { matricNo, name } = user;
      const markedAt = new Date().toISOString();
      const markedDate = markedAt.split("T")[0];

      const currentTime = new Date();
      const twelveHoursAgo = new Date(
        currentTime.getTime() - 12 * 60 * 60 * 1000
      ); // 12 hours ago

      const coursesRef = firestore.collection("courses");
      const querySnapshot = await coursesRef
        .where("lecturerName", "==", lecturerName)
        .where("title", "==", courseTitle)
        .get();

      if (!querySnapshot.empty) {
        const courseDoc = querySnapshot.docs[0];
        const attendanceRef = courseDoc.ref.collection("attendance");

        // Check if attendance for today exists
        const attendanceSnapshot = await attendanceRef
          .where("matricNo", "==", matricNo)
          .where("date", "==", markedDate)
          .get();

        let newMarkedAttendance = [...markedAttendance]; // Copy existing markedAttendance
        storeStudentAttendance(matricNo, markedDate, markedAt.split("T")[1].split(".")[0], courseTitle);

        if (!attendanceSnapshot.empty) {
          // If attendance exists, update the presence count
          const attendanceDoc = attendanceSnapshot.docs[0];
          const attendanceData = attendanceDoc.data();
          const existingPresence = attendanceData.presence || 0;
          const newPresence = existingPresence + 1;

          await attendanceDoc.ref.update({
            presence: newPresence,
          });

          // Update presence in the markedAttendance array
          newMarkedAttendance.forEach((attendance) => {
            if (
              attendance.matricNo === matricNo &&
              attendance.date === markedDate
            ) {
              attendance.presence = newPresence;
            }
          });

          alert("Attendance updated successfully!");
        } else {
          // If attendance doesn't exist for the day, add new attendance record
          newMarkedAttendance.unshift({
            // Prepend new attendance record
            matricNo: matricNo,
            name: name,
            date: markedDate,
            time: markedAt.split("T")[1].split(".")[0],
            presence: 1, // Start with presence count as 1
          });

          await attendanceRef.add({
            matricNo: matricNo,
            name: name,
            date: markedDate,
            time: markedAt.split("T")[1].split(".")[0],
            presence: 1, // Start with presence count as 1
          });

          alert("Attendance marked successfully!");
        }

        // Update markedAttendance state
        setMarkedAttendance(newMarkedAttendance);
        setIsAttendanceMarked(true);
        setLastMarkedDate(markedDate);

        // Send the attendance data to the lecturer's page
        sendAttendanceDataToLecturer(
          courseDoc.id,
          newMarkedAttendance.length
        );

        // Store attendance for the student
        storeStudentAttendance(matricNo, markedDate);
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

  const sendAttendanceDataToLecturer = async (
    courseId,
    attendanceRecord,
    newMarkedAttendance
  ) => {
    try {
      const courseDoc = await firestore.collection("courses").doc(courseId).get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data();
        const lecturerName = courseData.lecturerName;
        const attendanceSheetId = courseData.attendanceSheetId;

        const attendanceRef = firestore.collection("attendance").doc(attendanceSheetId);
        const attendanceDoc = await attendanceRef.get();

        if (attendanceDoc.exists) {
          const updatedAttendance = [...attendanceDoc.data().attendance, attendanceRecord];
          await attendanceRef.update({
            attendance: updatedAttendance,
            markedAttendance: newMarkedAttendance, // Update markedAttendance in the attendance sheet
          });
          console.log("Attendance data sent to lecturer's page successfully!");
        } else {
          console.log("Attendance document not found.");
        }
      } else {
        console.log("Course document not found.");
      }
    } catch (error) {
      console.error("Error sending attendance data to lecturer:", error);
    }
  };

  const storeStudentAttendance = async (matricNo, markedDate, markedTime, courseTitle) => {
    try {
      const studentAttendanceRef = firestore.collection("studentAttendance");
      await studentAttendanceRef.add({
        matricNo: matricNo,
        date: markedDate,
        time: markedTime,
        courseTitle: courseTitle
      });
      console.log("Student attendance stored successfully!");
    } catch (error) {
      console.error("Error storing student attendance:", error);
    }
  };
  
  const fetchAttendance = async () => {
    try {
      // Fetch attendance data for the current user
      const attendanceRef = firestore.collection("studentAttendance");
      const querySnapshot = await attendanceRef.where("matricNo", "==", user.matricNo).get();
  
      const fetchedData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedData.push({
          matricNo: data.matricNo,
          date: data.date,
          time: data.time,
          courseTitle: data.courseTitle
        });
      });
  
      setFetchedAttendance(fetchedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      alert("Error fetching attendance. Please try again later.");
    }
  };
  

  // useEffect to fetch profile photo when component mounts
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);
    if(userData && userData.matricNo) {
      fetchProfilePhoto(userData.matricNo);
    }
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
  
  {fetchedAttendance.length > 0 && (
  <div className="fetched-attendance">
    <h3 className="attendance-title">Fetched Attendance:</h3>
    <ul className="attendance-list">
      {fetchedAttendance.map((attendance, index) => (
        <li key={index} className="attendance-item">
          <p className="attendance-info">Matric No: {attendance.matricNo}</p>
          <p className="attendance-info">Date: {attendance.date}</p>
          <p className="attendance-info">Time: {attendance.time}</p>
          <p className="attendance-info">Course Title: {attendance.courseTitle}</p>
        </li>
      ))}
    </ul>
  </div>
)}
  
          <button onClick={fetchAttendance}>Fetch Attendance</button>
  
          {fetchedAttendance.length > 0 && (
            <div className="fetched-attendance">
              <h3>Fetched Attendance:</h3>
              <ul>
  {fetchedAttendance.map((attendance, index) => (
    <li key={index} className="attList">
      <p className="matricNo">Matric No: {attendance.matricNo}</p>
      <p className="date">Date: {attendance.date}</p>
      <p className="time">Time: {attendance.time}</p>
      <p className="courseTitle">Course Title: {attendance.courseTitle}</p>
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
