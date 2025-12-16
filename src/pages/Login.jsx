import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/"); // Redirect to dashboard
    } catch (error) {
      console.error("Login Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-neutral-900 border border-neutral-700 p-8 rounded-2xl shadow-2xl w-96 transition-transform hover:scale-[1.02]"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center tracking-wide">
          Admin Login
        </h2>

        <div className="mb-5">
          <label className="block text-sm mb-2 text-neutral-300">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-white placeholder-neutral-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2 text-neutral-300">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-white placeholder-neutral-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            loading
              ? "bg-gray-400 text-gray-800 cursor-not-allowed"
              : "bg-white text-black hover:bg-neutral-200"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-neutral-500 text-center mt-6">
          © {new Date().getFullYear()} Nikyukti Admin Panel
        </p>
      </form>
    </div>
  );
}
