import React, { useState,useEffect } from "react";
import { FaMobileAlt, FaEdit } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

export default function Banner() {
  const [bgImage, setBgImage] = useState("/images/bg.png");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/banner/upload`;
  useEffect(() => {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/banner`)
        .then(res => res.json())
        .then(data => {
          console.log("Fetched banner data:", data);
          if (data.success && data.imageUrl) {
            setBgImage(data.imageUrl);
          }
        })
        .catch(console.error);
    }, []);
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      const { data } = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload successful:", data);

      // Update state with new image URL from S3
      setBgImage(data.imageUrl);
      setIsEditing(false);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {/* Mobile Mockup Frame */}
      <div className="relative w-[320px] h-[640px] bg-black rounded-[40px] shadow-2xl border-8 border-black overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black w-32 h-6 rounded-b-3xl z-30"></div>

        {/* Edit Button (inside phone) */}
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 bg-white/80 text-black px-3 py-1 rounded-full text-sm shadow-md hover:bg-white transition-all"
          >
            <FaEdit className="text-sm" />
            {isEditing ? "Cancel" : "Edit"}
          </button>

          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 text-xs text-gray-800 bg-white rounded-md px-1 py-1 shadow"
            />
          )}
        </div>

        {/* Screen */}
        <div
          className="relative w-full h-full bg-cover bg-center text-white flex flex-col justify-end"
          style={{
            backgroundImage: `url('${bgImage}')`,
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>

          {/* Content */}
          <div className="relative z-10 text-center px-6 pb-10">
            <div className="mb-6">
              <h1 className="text-lg font-bold">
                Niyukti: Your Key to Exam Success
              </h1>
              <p className="text-gray-300 text-xs mt-1">
                Your Journey to Knowledge Starts Here.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-4 mt-6">
              <button className="w-full flex items-center justify-center gap-2 bg-[#cc6b49] text-white font-semibold py-3 rounded-xl shadow-md hover:bg-[#b45d40] transition-all">
                <FaMobileAlt className="text-sm" />
                Continue with Mobile
              </button>

              <div className="flex items-center justify-center space-x-2 text-gray-300 text-xs">
                <span className="w-10 h-px bg-gray-500"></span>
                <span>or</span>
                <span className="w-10 h-px bg-gray-500"></span>
              </div>

              <button className="w-12 h-12 flex items-center justify-center mx-auto bg-white rounded-full shadow-lg hover:shadow-xl transition-all">
                <FcGoogle className="text-2xl" />
              </button>
            </div>

            {/* Footer */}
            <div className="flex justify-center mt-8 text-xs text-gray-400 space-x-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Line (Home indicator) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-gray-400 opacity-70"></div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg">
          Uploading...
        </div>
      )}
    </div>
  );
}
