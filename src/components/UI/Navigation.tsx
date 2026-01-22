import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  TagIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from './UserDropdown';

// Navigation items configuration with icons
const navItems = [
  { path: '/', label: 'Dashboard', Icon: HomeIcon },
  { path: '/history', label: 'History', Icon: ClockIcon },
  { path: '/recurring', label: 'Recurring', Icon: ArrowPathIcon },
  { path: '/analytics', label: 'Analytics', Icon: ChartBarIcon },
  { path: '/expense-types', label: 'Expense Types', Icon: TagIcon },
];

export default function Navigation() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      setMobileMenuOpen(false);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="Loggy"
              className="h-10 w-auto mr-2 mb-2"
            />
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(path)
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden lg:flex lg:items-center">
            <UserDropdown onSignOut={handleSignOut} />
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 p-2 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              <div className="relative w-6 h-6">
                <Bars3Icon
                  className={`absolute h-6 w-6 transition-all duration-300 ease-in-out ${
                    mobileMenuOpen
                      ? 'opacity-0 rotate-90'
                      : 'opacity-100 rotate-0'
                  }`}
                />
                <XMarkIcon
                  className={`absolute h-6 w-6 transition-all duration-300 ease-in-out ${
                    mobileMenuOpen
                      ? 'opacity-100 rotate-0'
                      : 'opacity-0 -rotate-90'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-2 pt-1.5 pb-2 space-y-0.5">
            {navItems.map(({ path, label, Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={handleMobileNavClick}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      active ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}

            {/* Settings - Mobile Only */}
            <Link
              to="/settings"
              onClick={handleMobileNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${
                isActive('/settings')
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <Cog6ToothIcon
                className={`h-5 w-5 flex-shrink-0 ${
                  isActive('/settings') ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <span>Settings</span>
            </Link>

            {/* Sign Out Button - Subtle Design */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors duration-150 mt-2"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
