import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { FaUsers, FaUserTie, FaUserShield } from "react-icons/fa";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/get-users`;

export default function Dashboard() {
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setUserCount(data?.totalUsers || 0);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-10 text-gray-800 dark:text-gray-200 min-h-screen bg-gray-50 dark:bg-gray-950 transition-all duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {/* Users Card */}
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Total Users</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and view all users in the system.
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FaUsers className="text-blue-600 dark:text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="mt-6 text-4xl font-bold text-blue-600 dark:text-blue-400">
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              <CountUp start={0} end={userCount} duration={2} />
            )}
          </div>
        </div>

        {/* Sample extra cards for aesthetics */}
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Active Staff</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Number of currently active staff members.
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <FaUserTie className="text-green-600 dark:text-green-400 text-3xl" />
            </div>
          </div>

          <div className="mt-6 text-4xl font-bold text-green-600 dark:text-green-400">
            <CountUp start={0} end={25} duration={2} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Admins</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Number of admin accounts in the system.
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <FaUserShield className="text-purple-600 dark:text-purple-400 text-3xl" />
            </div>
          </div>

          <div className="mt-6 text-4xl font-bold text-purple-600 dark:text-purple-400">
            <CountUp start={0} end={5} duration={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
