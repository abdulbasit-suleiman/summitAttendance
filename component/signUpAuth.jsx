import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router"; // Import useRouter from next/router

const SignUpAuthCapture = () => {
  const router = useRouter(); // Initialize router for navigation
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [step, setStep] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  const instructions = [
    "Smile! Capturing...",
    "Turn your face upward! Capturing...",
    "Turn your face right! Capturing...",
    "Turn your face left! Capturing...",
  ];

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      // Set the canvas dimensions to match the video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw the captured image on the screen
      const imageDataUrl = canvas.toDataURL("image/png");
      setCapturedImages((prevImages) => [...prevImages, imageDataUrl]);

      setShowCamera(false); // Hide the camera after capturing
    }
  };

  const handleCaptureButtonClick = () => {
    setShowCamera(true);
    captureImage();
  };

  const handleSaveButtonClick = () => {
    nextStep();
  };

  const handleRetakeButtonClick = () => {
    setShowCamera(true); // Show the camera for retaking the image
  };

  const nextStep = () => {
    if (step < instructions.length - 1) {
      setStep((prevStep) => prevStep + 1);
      setShowCamera(true); // Show the camera for the next image
    } else {
      // No more images to capture
      setStep(0); // Reset back to the first step
      setShowCamera(false); // Hide the camera
      setSuccessMessage("Authentication successful!"); // Display success message

      // Redirect to ./signUpAuthComplete after 1 second
      setTimeout(() => {
        router.push("/studentsPage/signUp/signUpAuthComplete"); // Use router.push for Next.js navigation
      }, 1000);
    }
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            setShowCamera(true); // Show the camera for the first image
          });
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    initCamera();

    return () => {
      // Clean up resources if needed (e.g., stop the camera stream).
      const video = videoRef.current;
      if (video) {
        const stream = video.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      }
    };
  }, []); // Empty dependency array to trigger useEffect only on mount

  return (
    <div className="AuthContainerCamera">
      <h1>Camera Capture</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          height: "80vh",
        }}
      >
        {showCamera && (
          <>
            <p>{instructions[step]}</p>
            <button onClick={handleCaptureButtonClick}>Capture Image</button>
          </>
        )}
        {capturedImages.length > 0 && !showCamera && (
          <div>
            {capturedImages.map((image, index) => (
              <div key={index}>
                <img src={image} alt={`Captured ${index + 1}`} />
              </div>
            ))}
            <button onClick={handleSaveButtonClick}>Save</button>
            <button onClick={handleRetakeButtonClick}>Retake</button>
          </div>
        )}
        {successMessage && <p>{successMessage}</p>}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: showCamera ? "block" : "none", margin: "10px 0" }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export default SignUpAuthCapture;
