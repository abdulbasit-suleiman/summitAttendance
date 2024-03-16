import Image from "next/image";
import React, { useState, useEffect } from "react";
import { firestore, storage } from "@/firebase";



function LecturerDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [courseTitleInput, setCourseTitleInput] = useState("");
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);
  const [newCourse, setNewCourse] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [fetchMethod, setFetchMethod] = useState("all");

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    setUser(userData);

    if (userData) {
      fetchCourses(userData.name);
    }
  }, []); // Trigger fetchCourses only on component mount, no dependencies

  useEffect(() => {
    if (user) {
      fetchCourses(user.name);
    }
  }, [user]); // Trigger fetchCourses when the user changes


  const handleInputChange = (e) => {
    let inputValue = e.target.value.toUpperCase();
    inputValue = inputValue.replace(/[^A-Z0-9]/g, "");
    if (inputValue.length <= 6) {
      setNewCourse(inputValue);
    }
  };
  const handleDateInput = (e) => {
    setDateInput(e.target.value); // Update dateInput state
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
      try {
        // Check if a course with the same title already exists
        const existingCourse = courses.find(course => course.title === newCourse);
        if (existingCourse) {
          alert("A course with the same title already exists.");
          return;
        }

        // Check if geolocation is supported
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser.');
          return;
        }

        // Request user's location
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;

          // Convert latitude and longitude to decimal degrees
          const latitudeDecimal = latitude;
          const longitudeDecimal = longitude;

          // Convert latitude and longitude to degrees, minutes, seconds
          const latitudeDegrees = Math.floor(latitude);
          const latitudeMinutes = Math.floor((latitude - latitudeDegrees) * 60);
          const latitudeSeconds = ((latitude - latitudeDegrees - (latitudeMinutes / 60)) * 3600).toFixed(2);
          const longitudeDegrees = Math.floor(longitude);
          const longitudeMinutes = Math.floor((longitude - longitudeDegrees) * 60);
          const longitudeSeconds = ((longitude - longitudeDegrees - (longitudeMinutes / 60)) * 3600).toFixed(2);

          // Convert latitude and longitude to hundredthsDecimal
          const latitudeHundredthsDecimal = (latitudeDegrees + (latitudeMinutes / 60) + (latitudeSeconds / 3600)).toFixed(4);
          const longitudeHundredthsDecimal = (longitudeDegrees + (longitudeMinutes / 60) + (longitudeSeconds / 3600)).toFixed(4);

          // Determine direction
          const latitudeDirection = latitude >= 0 ? 'N' : 'S';
          const longitudeDirection = longitude >= 0 ? 'E' : 'W';

          // Continue saving course with location details
          let uniqueCode = generateUniqueCode();
          const courseRef = firestore.collection("courses").doc();
          const attendanceRef = firestore.collection("attendance").doc();

          // Create a new attendance sheet
          const attendanceData = {
            courseTitle: newCourse,
            lecturerName: user.name,
            attendance: [],
          };

          await attendanceRef.set(attendanceData);

          // Create the course
          await courseRef.set({
            title: newCourse,
            lecturerName: user.name,
            uniqueCode: uniqueCode,
            attendanceSheetId: attendanceRef.id,
            lecturerLocation: {
              latitude: latitudeDecimal,
              longitude: longitudeDecimal,
              degreesDecimal: {
                latitude: latitudeDegrees,
                longitude: longitudeDegrees,
              },
              minutesDecimal: {
                latitude: latitudeMinutes,
                longitude: longitudeMinutes,
              },
              secondsDecimal: {
                latitude: latitudeSeconds,
                longitude: longitudeSeconds,
              },
              hundredthsDecimal: {
                latitude: latitudeHundredthsDecimal,
                longitude: longitudeHundredthsDecimal,
              },
              direction: {
                latitude: latitudeDirection,
                longitude: longitudeDirection,
              },
            },
          });

          fetchCourses(user.name);
          setNewCourse("");

          const updateUniqueCode = async () => {
            const updatedCourseRef = firestore.collection("courses").doc(courseRef.id);

            let updatedUniqueCode = generateUniqueCode();
            while (updatedUniqueCode === uniqueCode) {
              updatedUniqueCode = generateUniqueCode();
            }

            await updatedCourseRef.update({
              uniqueCode: updatedUniqueCode,
            });

            fetchCourses(user.name);
          };

          updateUniqueCode(); // Update unique code immediately after course creation
        }, (error) => {
          // Handle location error
          console.error("Location error:", error);
          alert("Error accessing location. Please try again later.");
        });
      } catch (error) {
        console.error("Location error:", error);
        alert("Error accessing location. Please try again later.");
      }
    }
  };
  const fetchProfilePhotoUrl = async (matricNo) => {
    try {
      const storageRef = storage.ref();
      const photoRef = storageRef.child(`profile_photos/${matricNo}`);
      return await photoRef.getDownloadURL();
    } catch (error) {
      console.error("Error fetching profile photo URL:", error);
      return null;
    }
  };
  
// Function to handle fetching by course title
const handleFetchByTitle = () => {
  setFetchMethod("all");
  fetchAttendanceRecords(courseTitleInput);
};
// Function to handle fetching by date
const handleFetchByDate = () => {
  setFetchMethod("date");
  fetchAttendanceRecordsD(courseTitleInput, dateInput);
};


  useEffect(() => {
    // Function to check if it's time to update the unique code
    const shouldUpdateCode = (lastUpdateTime) => {
      const currentTime = Date.now();
      // Check if 3 minutes (or your desired interval) have passed since the last update
      return (currentTime - lastUpdateTime) >= (3 * 60 * 1000);
    };

    // Function to update the unique code
    const updateUniqueCode = async (course) => {
      const updatedUniqueCode = generateUniqueCode();
      // Update the unique code and last update time in the database
      await firestore.collection("courses").doc(course.id).update({ uniqueCode: updatedUniqueCode, lastUpdateTime: Date.now() });
    };

    // Update unique codes for all courses every 3 minutes
    const intervalId = setInterval(async () => {
      const coursesToUpdate = courses.filter(shouldUpdateCode);
      for (const course of coursesToUpdate) {
        await updateUniqueCode(course);
      }
    }, 3 * 60 * 1000); // Every 3 minutes

    // Cleanup function to clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, [courses]); // Trigger whenever the courses state changes

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
        setIsFetchingAttendance(false); // Set loading indicator to false
        return;
      }

      const courseDoc = querySnapshot.docs[0];
      const attendanceRef = courseDoc.ref.collection("attendance");

      // Fetch attendance records directly from the course's attendance subcollection
      const attendanceSnapshot = await attendanceRef.get();

      if (attendanceSnapshot.empty) {
        setAttendanceRecords([]); // Clear attendance records
        setIsFetchingAttendance(false); // Set loading indicator to false
        return;
      }

      const attendanceArray = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAttendanceRecords(attendanceArray); // Set attendance records
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      alert("Error fetching attendance records. Please try again later.");
    } finally {
      setIsFetchingAttendance(false); // Set loading indicator to false
    }
  };
  const fetchAttendanceRecordsD = async (courseTitle, date) => {
    if (!user) {
      console.error("User not logged in");
      return;
    }
  
    setIsFetchingAttendance(true); // Set loading indicator to true
    try {
      const coursesRef = firestore.collection("courses");
      const querySnapshot = await coursesRef
        .where("lecturerName", "==", user.name)
        .where("title", "==", courseTitle)
        .get();
  
      if (querySnapshot.empty) {
        alert("No course found with the specified title.");
        setIsFetchingAttendance(false); // Set loading indicator to false
        return;
      }
  
      const courseDoc = querySnapshot.docs[0];
      const attendanceRef = courseDoc.ref.collection("attendance");
  
      const attendanceSnapshot = await attendanceRef.where("date", "==", date).get();
  
      if (attendanceSnapshot.empty) {
        setAttendanceRecords([]); // Clear attendance records
        setIsFetchingAttendance(false); // Set loading indicator to false
        return;
      }
  
      const attendanceArray = await Promise.all(attendanceSnapshot.docs.map(async (doc) => {
        const attendanceData = doc.data();
        // Fetch profile photo URL only when fetching by date
        const photoUrl = dateInput ? await fetchProfilePhotoUrl(attendanceData.matricNo) : null;
        return { ...attendanceData, photoUrl };
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

  // Function to check if it's time to update the unique code
  const shouldUpdateCode = (lastUpdateTime) => {
    const currentTime = Date.now();
    // Check if 3 minutes (or your desired interval) have passed since the last update
    return (currentTime - lastUpdateTime) >= (3 * 60 * 1000);
  };

  // Function to update the unique code

  const updateUniqueCode = async (course) => {
    const updatedUniqueCode = generateUniqueCode();
    // Update the unique code and last update time in the database
    await firestore.collection("courses").doc(course.id).update({ uniqueCode: updatedUniqueCode, lastUpdateTime: Date.now() });
  };
  const handleManualUpdate = async (course) => {
    try {
      const updatedUniqueCode = generateUniqueCode(); // Generate a new unique code
      await firestore.collection("courses").doc(course.id).update({ uniqueCode: updatedUniqueCode }); // Update the unique code in Firestore
      fetchCourses(user.name); // Fetch updated courses
    } catch (error) {
      console.error("Error updating unique code:", error);
      alert("Error updating unique code. Please try again later.");
    }
  };


  // Fetch courses function
  const fetchCourses = async (lecturerName) => {
    try {
      if (!lecturerName) {
        return;
      }

      const coursesRef = firestore.collection("courses").where("lecturerName", "==", lecturerName);
      const snapshot = await coursesRef.get();
      const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check if it's time to update the unique code for each course
      fetchedCourses.forEach(async (course) => {
        if (shouldUpdateCode(course.lastUpdateTime)) {
          await updateUniqueCode(course);
        }
      });

      setCourses(fetchedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Error fetching courses. Please try again later.");
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
          <div className="add-course">
            <h3>Add Course</h3>
            <input
              type="text"
              value={newCourse}
              onChange={handleInputChange}
              placeholder="Enter course title (e.g., ABC123)"
              maxLength="6"
            />
            <button onClick={saveCourse}>Add New Course</button>
          </div>

          <div className="fetch-attendance">
            <h3>Fetch Attendance by Course Title</h3>
            <input
              type="text"
              value={courseTitleInput}
              onChange={handleCourseTitleInput}
              placeholder="Enter course title"
            />
            <button onClick={() => fetchAttendanceRecords(courseTitleInput)}>Fetch All</button>
            <input
    type="date"
    value={dateInput}
    onChange={handleDateInput}
    placeholder="Select date"
  />
  <button onClick={() => fetchAttendanceRecordsD(courseTitleInput, dateInput)}>Fetch by Date</button>
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
                  <th>ProfilePhoto</th>
                </tr>
              </thead>
              <tbody>
              {attendanceRecords.map((record, index) => (
  <tr key={index}>
    <td>{record.name}</td>
    <td>{record.matricNo}</td>
    <td>{record.date}</td>
    <td>{record.time}</td>
    <td>{record.presence}</td>
    <td>
      {record.photoUrl ? (
        <Image src={record.photoUrl} alt="ph" width={100} height={100} />
      ) : (
        <span>No photo available</span>
      )}
    </td>
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
                  <li key={index} >
                    {course.title} - Unique Code: {course.uniqueCode}
                    <button className="courseList" onClick={() => handleManualUpdate(course)}>Update Code</button>
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
