import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { firestore } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';

const Logo = "/asset/logo.svg";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');



  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !password) {
      // setErrorMessage('Please enter both email and password');
      alert('Please enter both email and password')
      return; // Prevent further execution of the function
    }
  
    try {
      console.log('Attempting sign-in with email:', email);
      const userSnapshot = await firestore.collection('users').where('email', '==', email).get();
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        console.log('User data retrieved:', userData);
        if (userData.password === password) {
          // Store user data in session upon successful sign-in
          sessionStorage.setItem('user', JSON.stringify(userData));
          console.log('Sign-in successful. Redirecting to dashboard.');
          router.replace('../dashboard/page');
        } else {
          setErrorMessage('Invalid password');
        }
      } else {
        setErrorMessage('User not found');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setErrorMessage('An error occurred while signing in');
    }
  };
  
  
  return (
    <div className="signUp">
      <div className="signUpHeader">
        <Image src={Logo} alt="" width={100} height={100} />
        <h4 className="bold-text">Student Attendance</h4>
        <h3>Sign In As Lecturer</h3>
      </div>
      <div className="signUpForm">
        {errorMessage && <p className="error-message" style={{ fontSize: '2rem', textAlign: "center" }}>{errorMessage}</p>}
        <form onSubmit={handleSignIn}>
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
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="Password">
            XXXXXX
          </label>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="signUpHeader">
            <button type="submit" className="signUpBtn">Sign In</button>
            <div><Link href='/resetPassword'>Reset password</Link></div>
          </div>
        </form>
      </div>
    </div>
  );
}
