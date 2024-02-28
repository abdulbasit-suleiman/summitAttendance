// import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
// import { auth } from "@/firebase";
function AuthDetails() {
  const [authUser, setAuthUser] = useState(null);
  useEffect(() => {
    const listen = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
      } else {
        setAuthUser(null);
      }
    });
    return () => {
      listen();
    };
  }, []);
  const UserSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log(successfull);
      })
      .catch((error) => console.log(error));
  };
  return (
    <div className="authDetails">
      {authUser ? (
        <>
          <p>{`Sign in as ${authUser.email}`}</p>
          <button onClick={UserSignOut}>Sign out</button>
        </>
      ) : (
        <p>Signed out</p>
      )}
    </div>
  );
}
export default AuthDetails;
