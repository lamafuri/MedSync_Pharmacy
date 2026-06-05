import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Gift,
  BarChart3,
  Crown,
  User,
  LogOut,
  Bell,
  X,
  ChevronDown,
  Link,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Modal from './Modal';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

function AppShell() {
  const { pharmacist, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/linked-patients', icon: Link, label: 'Linked Patients' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/offers', icon: Gift, label: 'Offers' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', premium: true },
  ];

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.label : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col bg-white border-r border-border fixed h-full">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="MedSync" className="w-10 h-10 rounded-lg object-contain" />
            <div>
              <span className="font-semibold text-primary">MedSync</span>
              <p className="text-xs text-muted">Pharmacist Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isPremiumLocked = item.premium && !pharmacist?.isPremium;

            return (
              <button
                key={item.path}
                onClick={() => !isPremiumLocked && navigate(item.path)}
                disabled={isPremiumLocked}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-[3px] ${
                  isActive
                    ? 'bg-mint-light text-mint font-semibold border-l-mint'
                    : 'text-muted hover:bg-faint border-l-transparent'
                } ${isPremiumLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span>{item.label}</span>
                {item.premium && !pharmacist?.isPremium && (
                  <Crown className="w-4 h-4 text-amber ml-auto" />
                )}
              </button>
            );
          })}

          {!pharmacist?.isPremium && (
            <>
              <div className="border-t border-border my-4" />
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-btn bg-amber text-white font-semibold hover:bg-amber/90 transition-colors"
              >
                <Crown className="w-5 h-5" strokeWidth={1.5} />
                <span>Upgrade to Premium</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white font-semibold">
              {pharmacist?.name?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary truncate">{pharmacist?.name}</p>
              <p className="text-xs text-muted truncate">{pharmacist?.pharmacyName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-muted hover:text-red transition-colors"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-border h-16 flex items-center justify-between px-4 lg:px-8">
          <h1 className="text-xl font-semibold text-primary">{getPageTitle()}</h1>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              onClick={() => {
                fetchNotifications();
                setShowNotifications(true);
              }}
              className="relative p-2 hover:bg-faint rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-muted" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red rounded-full" />
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-2 hover:bg-faint rounded-full transition-colors"
              >
                <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {pharmacist?.name?.charAt(0) || 'P'}
                </div>
                <ChevronDown className="w-4 h-4 text-muted" strokeWidth={1.5} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-modal border border-border overflow-hidden">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-faint transition-colors"
                  >
                    <User className="w-4 h-4 text-muted" strokeWidth={1.5} />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-faint text-red transition-colors"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        {/* pb-20 on mobile clears the fixed bottom nav (~69px); lg:p-8 resets all padding on desktop */}
        <main className="p-4 pb-20 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Notification Drawer */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        size="sm"
      >
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-center text-muted py-8">No notifications</p>
          ) : (
            <>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-mint hover:text-mint/80"
                >
                  Mark all as read
                </button>
              )}
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                  className={`p-4 rounded-card border transition-colors cursor-pointer ${
                    notification.read
                      ? 'bg-faint border-border'
                      : 'bg-white border-l-4 border-l-mint border-border shadow-sm'
                  }`}
                >
                  <p className={`font-semibold text-primary text-sm ${!notification.read ? 'font-bold' : ''}`}>
                    {notification.title}
                  </p>
                  <p className="text-muted text-sm mt-1">{notification.message}</p>
                  <p className="text-xs text-muted mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </Modal>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around p-2 safe-area-bottom">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-mint' : 'text-muted'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default AppShell;
