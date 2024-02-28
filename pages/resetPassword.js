import { useState } from "react";
import { auth } from '@/firebase';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [resetRequested, setResetRequested] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await auth.sendPasswordResetEmail(email);
      setResetRequested(true);
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  };

  return (
    <div>
      {!resetRequested ? (
        <form className="resetPassword" onSubmit={handleResetPassword}>
          <label htmlFor="email" style={{fontSize:"1.3rem"}}>Enter your email address:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="resetBtn  ">Reset Password</button>
        </form>
      ) : (
        <p>
          Password reset email sent! Please check your email for instructions
          on how to reset your password.
        </p>
      )}
    </div>
  );
}

export default ResetPassword;
