import { useEffect, useState } from "react";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isImageSaved, setIsImageSaved] = useState(false);

  useEffect(() => {
    // Retrieve user data from session
    const userData = JSON.parse(sessionStorage.getItem('user'));
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

  // Function to update user data with the new profile image
  const updateProfileImage = () => {
    setUser((prevUser) => ({
      ...prevUser,
      profileImage: profileImage,
    }));
    setIsImageSaved(true); // Set flag to indicate image is saved
    // You may also want to update the sessionStorage here to persist the changes
  };

  return (
    <div className="dashboard">
      <h2>Lecturer Dashboard</h2>
      {user && (
        <div className="dashboardPage">
        <span className="welcome">  <p style={{display:'flex', gap:'3rem', color:'green'}}>
        
         <div className="profile photo"> {profileImage && (
              <div>
              <img src={profileImage} alt="Profile" style={{ borderRadius: '50px' , width:'100px' , height:'100px'}} />
              {!isImageSaved && <button onClick={updateProfileImage}>Save Profile Image</button>}
            </div>
          )}
          {!profileImage && (
            <div>
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </div>
          )}</div>
            <h2 style={{}}>{user.name}</h2>
        </p>
          </span>

          <p>Email: {user.email}</p>
          <p>college: {user.college}</p>
          <p>department: {user.department}</p>
          <div><button>Add course </button></div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
