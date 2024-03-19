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

        // Fetch and compare locations once course data is fetched
        await fetchAndCompareLocations(courseData.lecturerLocation);
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

  const fetchAndCompareLocations = async (lecturerLocation) => {
    try {
      // Fetch student's location
      const studentLocation = await fetchLocation();
      if (!studentLocation) {
        alert("Unable to fetch student's location.");
        return;
      }

      // Calculate distance between student and lecturer locations
      const distance = calculateDistance(lecturerLocation, studentLocation);

      // Define acceptable range (in meters)
      const acceptableRange = 50; // Adjust as needed

      // Check if distance is within acceptable range
      if (distance <= acceptableRange) {
        // If locations match, proceed with marking attendance
        markAttendance();
      } else {
        alert("You are not in class. Attendance cannot be marked.");
      }

      // Log student and lecturer locations to console
      console.log("Student Location:", studentLocation);
      console.log("Lecturer Location:", lecturerLocation);
    } catch (error) {
      console.error("Error fetching and comparing locations:", error);
    }
  };

  const fetchLocation = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
  
      // Extract latitude and longitude components
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
  
      // Convert decimal degrees to degrees, minutes, and seconds
      const latDegrees = Math.floor(latitude);
      const latMinutes = Math.floor((latitude - latDegrees) * 60);
      const latSeconds = ((latitude - latDegrees) * 60 - latMinutes) * 60;
  
      const longDegrees = Math.floor(longitude);
      const longMinutes = Math.floor((longitude - longDegrees) * 60);
      const longSeconds = ((longitude - longDegrees) * 60 - longMinutes) * 60;
  
      // Direction indicators
      const latDirection = latitude >= 0 ? 'N' : 'S';
      const longDirection = longitude >= 0 ? 'E' : 'W';
  
      // Construct the location object in the required format
      const location = {
        latitude: latitude,
        longitude: longitude,
        degreesDecimal: {
          latitude: latDegrees,
          longitude: longDegrees,
        },
        minutesDecimal: {
          latitude: latMinutes,
          longitude: longMinutes,
        },
        secondsDecimal: {
          latitude: latSeconds.toFixed(2),
          longitude: longSeconds.toFixed(2),
        },
        hundredthsDecimal: {
          latitude: ((latSeconds - Math.floor(latSeconds)) * 100).toFixed(2),
          longitude: ((longSeconds - Math.floor(longSeconds)) * 100).toFixed(2),
        },
        direction: {
          latitude: latDirection,
          longitude: longDirection,
        },
      };
  
      return location;
    } catch (error) {
      console.error("Error fetching location:", error);
      return null;
    }
  };
  
  const calculateDistance = (location1, location2) => {
    const lat1 = location1.latitude;
    const lon1 = location1.longitude;
    const lat2 = location2.latitude;
    const lon2 = location2.longitude;
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180); // Convert degrees to radians
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance * 1000; // Convert to meters
  };

  const fetchLecturerLocation = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (error) {
      console.error("Error fetching lecturer's location:", error);
      return null;
    }
  };

  // Function to fetch the student's location
  const fetchStudentLocation = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (error) {
      console.error("Error fetching student's location:", error);
      return null;
    }
  };


  const handleMarkAttendance = async () => {
    const profilePhotoBlob = await fetch(profilePhotoURL).then((res) => res.blob());
    const profileImage = await tf.browser.fromPixels(profilePhotoBlob);
    const capturedImageData = await captureImage();

    if (capturedImageData) {
      const capturedImage = tf.browser.fromPixels(capturedImageData);
      const isMatch = await compareFaces(profileImage, capturedImage);
      
      if (isMatch) {
        // Proceed with marking attendance
        markAttendance();
      } else {
        alert("Face recognition failed. Attendance cannot be marked.");
      }
    }
  };

  const markAttendance = async () => {
    try {
      // Fetch the lecturer's location
      const lecturerLocation = await fetchLecturerLocation();
      if (!lecturerLocation) {
        alert("Unable to fetch lecturer's location.");
        return;
      }
  
      // Fetch the student's location
      const studentLocation = await fetchStudentLocation();
      if (!studentLocation) {
        alert("Unable to fetch student's location.");
        return;
      }
  
      // Calculate the distance between lecturer's and student's locations
      const distance = calculateDistance(lecturerLocation, studentLocation);
  
      // Define the acceptable range (in meters)
      const acceptableRange = 50; // Adjust as needed
  
      // Check if the distance exceeds the acceptable range
      if (distance > acceptableRange) {
        alert("You are not in class. Attendance cannot be marked.");
        return;
      }
  
      // If all conditions are met, proceed with marking attendance
      if (!lecturerName || !courseTitle) {
        alert("Please verify lecturer and course first.");
        return;
      }
  
      const { matricNo, name } = user;
      const markedAt = new Date().toISOString();
      const markedDate = markedAt.split("T")[0];
  
      const currentTime = new Date();
      const sixHoursAgo = new Date(
        currentTime.getTime() - 6 * 60 * 60 * 1000
      ); // 6 hours ago
  
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
  
        if (!attendanceSnapshot.empty) {
          const lastAttendance = attendanceSnapshot.docs[0].data();
          const lastMarkedTime = new Date(
            lastAttendance.time
          ).getTime();
  
          if (lastMarkedTime < sixHoursAgo.getTime()) {
            const attendanceDoc = attendanceSnapshot.docs[0];
            const existingPresence = lastAttendance.presence || 0;
            const newPresence = existingPresence + 1;
  
            await attendanceDoc.ref.update({
              presence: newPresence,
            });
  
            alert("Attendance updated successfully!");
          } else {
            alert("You have already marked attendance for this course today.");
          }
        } else {
          // If attendance doesn't exist for today, add new attendance record
          await attendanceRef.add({
            matricNo: matricNo,
            name: name,
            date: markedDate,
            time: markedAt.split("T")[1].split(".")[0],
            presence: 1, // Start with presence count as 1
          });
  
          alert("Attendance marked successfully!");
        }
  
        // Fetch updated attendance data after marking
        fetchAttendance();
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
        const attendanceSheetId = courseData.attendanceSheetId;
  
        const attendanceRef = firestore.collection("attendance").doc(attendanceSheetId);
        const attendanceDoc = await attendanceRef.get();
  
        if (attendanceDoc.exists) {
          const updatedAttendance = attendanceDoc.data().attendance.concat(attendanceRecord);
          const updateData = {
            attendance: updatedAttendance
          };
          if (newMarkedAttendance !== undefined) {
            updateData.markedAttendance = newMarkedAttendance;
          }
          await attendanceRef.update(updateData);
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
      if (!markedTime) {
        markedTime = new Date().toISOString().split("T")[1].split(".")[0];
      }
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
    if (userData && userData.matricNo) {
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