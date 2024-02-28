
import Image from "next/image";
const Logo="/asset/logo.svg"


function Splash() {
  return (
    <div className="splashContainer" >
      <Image src={Logo}  alt=""
          width={100}
          height={100} 
          className="splashLogo"/>
      <h4 className="splashText">SUN ATTENDANCE</h4>
    </div>
  );
}
export default Splash;
