
import Image from "next/image";
import Link from "next/link";
const Logo = "/asset/logo.svg"
function SignUpLogin() {

    return (
        <div className="signUp" >
            <div className="signUpHeader">
                <Image src={Logo} alt=""
                    width={100}
                    height={100} />
                <h4 className="bold-text">SUN ATTENDANCE</h4>
                <h4 className="bold-text" style={{ margin: "2rem", fontSize:"0.8rem",fontWeight:"700" }}>ATTENDANCE LOGIN</h4>
            </div>
            <div className="signUpLogin">
                <div className="boxcColor">
                    <Link href="/studentsPage/signIn/page">
                    Student Account
                    </Link>
                </div>
                <div className="boxcColor">
                    <Link href="/lecturersPage/signIn/page">
                    Lecturers Account
                    </Link>
                </div>
                <div className="boxcColor">
                    <Link href="#">
                    Exam Attendance
                    </Link>
                </div>
                <div className="boxcColor">
                    <Link href="#">
                    Event Attendance
                    </Link>
                </div>
            </div>
            <div >
                <Link href="/studentsPage/signUp/page" className="loginLink">Don't have an account Signup </Link>          
            </div>
        </div>
    );
}
export default SignUpLogin;
