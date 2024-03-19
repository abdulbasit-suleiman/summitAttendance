import { useEffect, useState } from "react";
import Splash from "./studentsPage/studentSplash";
import SignUpLogin from "./signUp-login";
import Head from "next/head";
import {
  FpjsProvider,
} from '@fingerprintjs/fingerprintjs-pro-react'
export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);
  return (
    <div>
      <Head>
        <title>SUN OFFA ATTENDANCE</title>
        <meta name='description' content='SUN OFFA ATTENDANCE' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className="home">
    {showSplash ? (<Splash />) : <SignUpLogin />}
    </div>
    </div>
  );
}
