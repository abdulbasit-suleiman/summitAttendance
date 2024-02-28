import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/router';
import { auth, firestore, storage } from '@/firebase';

const Logo = "/asset/logo.svg";

function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for error messages
  const nameErrorRef = useRef('');
  const emailErrorRef = useRef('');
  const collegeErrorRef = useRef('');
  const departmentErrorRef = useRef('');
  const passwordErrorRef = useRef('');

  // Function to handle form input changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'name':
        setName(value);
        nameErrorRef.current = '';
        break;
      case 'email':
        setEmail(value);
        emailErrorRef.current = '';
        break;
      case 'college':
        setCollege(value);
        collegeErrorRef.current = '';
        break;
      case 'department':
        setDepartment(value);
        departmentErrorRef.current = '';
        break;
      case 'password':
        setPassword(value);
        passwordErrorRef.current = '';
        break;
      default:
        break;
    }
  };

  // Function to handle sign-up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    let hasErrors = false;
    // Check for empty fields
    if (name.trim() === '') {
      nameErrorRef.current = 'Please enter your name.';
      hasErrors = true;
    }
    if (email.trim() === '') {
      emailErrorRef.current = 'Please enter your email address.';
      hasErrors = true;
    } if (college.trim() === '') {
      collegeErrorRef.current = 'Please enter your college .';
      hasErrors = true;
    }
    if (department.trim() === '') {
      departmentErrorRef.current = 'Please enter your department .';
      hasErrors = true;
    }
    if (password.trim() === '') {
      passwordErrorRef.current = 'Please enter your password .';
      hasErrors = true;
    }

    // Check if email already exists
    const emailSnapshot = await firestore.collection('users').where('email', '==', email).get();
    if (!emailSnapshot.empty) {
      emailErrorRef.current = 'Email already exists.';
      hasErrors = true;
    }

  

    if (hasErrors) {
      alert('Please check for errors in the following fields:\n' +
        nameErrorRef.current + '\n' +
        collegeErrorRef.current + '\n' +
        emailErrorRef.current + '\n' +
        passwordErrorRef.current + '\n' +
        departmentErrorRef.current + '\n'
      );
      return;
    }


    try {
      // Store user data in Firestore
      await firestore.collection('users').doc().set({
        name,
        email,
        college,
        department,
        password
      });


      setSuccessMessage('Details have been stored successfully.');
      alert('Account created successfully');
      router.push('../signIn/page');
    } catch (error) {
      setErrorMessage(error.message);
    }



    setName('');
    setEmail('');
    setCollege('');
    setDepartment('');
    setPassword('');

  };
  return (
    <div className="signUp">
      <div className="signUpHeader">
        <Image src={Logo} alt="" width={100} height={100} />
        <h4 className="bold-text">Lecturer Attendance</h4>
        <h3>Sign Up As Lecturer</h3>
      </div>
      <div className="signUpForm">


        <form onSubmit={handleSignUp}>
          <label htmlFor="fullName">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.0009 17C15.6633 17 18.8659 18.5751 20.608 20.9247L18.766 21.796C17.3482 20.1157 14.8483 19 12.0009 19C9.15346 19 6.6535 20.1157 5.23577 21.796L3.39453 20.9238C5.13673 18.5747 8.33894 17 12.0009 17ZM12.0009 2C14.7623 2 17.0009 4.23858 17.0009 7V10C17.0009 12.6888 14.8786 14.8818 12.2178 14.9954L12.0009 15C9.23945 15 7.00087 12.7614 7.00087 10V7C7.00087 4.31125 9.12318 2.11818 11.784 2.00462L12.0009 2ZM12.0009 4C10.4032 4 9.09721 5.24892 9.00596 6.82373L9.00087 7V10C9.00087 11.6569 10.344 13 12.0009 13C13.5986 13 14.9045 11.7511 14.9958 10.1763L15.0009 10V7C15.0009 5.34315 13.6577 4 12.0009 4Z"
                fill="#00923F"
              />
            </svg>
          </label>
          <input type="text" value={name} onChange={handleChange} placeholder="Enter Full Name" name="name" />

          <label htmlFor="Email">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM20 7.23792L12.0718 14.338L4 7.21594V19H20V7.23792ZM4.51146 5L12.0619 11.662L19.501 5H4.51146Z"
                fill="#00923F"
              />
            </svg>
          </label>
          <input type="email" value={email} onChange={handleChange} placeholder="Enter Personal Email" name="email" />
          <label htmlFor="Department">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 11.3333L0 9L12 2L24 9V17.5H22V10.1667L20 11.3333V18.0113L19.7774 18.2864C17.9457 20.5499 15.1418 22 12 22C8.85817 22 6.05429 20.5499 4.22263 18.2864L4 18.0113V11.3333ZM6 12.5V17.2917C7.46721 18.954 9.61112 20 12 20C14.3889 20 16.5328 18.954 18 17.2917V12.5L12 16L6 12.5ZM3.96927 9L12 13.6846L20.0307 9L12 4.31541L3.96927 9Z"
                fill="#00923F"
              />
            </svg>
          </label>
          <input type="text" value={department} onChange={handleChange} placeholder="Enter department" name="department" />

          <label htmlFor="College">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L0 9L12 16L22 10.1667V17.5H24V9L12 2ZM3.99902 13.4905V18.0001C5.82344 20.429 8.72812 22.0001 11.9998 22.0001C15.2714 22.0001 18.1761 20.429 20.0005 18.0001L20.0001 13.4913L12.0003 18.1579L3.99902 13.4905Z"
                fill="#00923F"
              />
            </svg>
          </label>
          <input type="text" value={college} onChange={handleChange} placeholder="Enter College Name" name="college" />

          <label htmlFor="Password">
            XXXXXX
          </label>
          <input type="password" value={password} onChange={handleChange} placeholder="Enter Your unique password" name="password" />
          <div className="signUpHeader">
            <button type="submit" className="signUpBtn">Save info</button>
            <h2 style={{ fontWeight: '800' }}>Already have an account <Link href="../signIn/page" style={{ fontWeight: '800' }}>SignIn</Link></h2>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
