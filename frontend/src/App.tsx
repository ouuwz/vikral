import HomePage from './pages/HomePage';
import BrandProfilesPage from './pages/BrandProfilesPage';
import DetectionLabPage from './pages/DetectionLabPage';
import SocialMonitoringPage from './pages/SocialMonitoringPage';
import AppMonitoringPage from './pages/AppMonitoringPage';
import DashboardPage from './pages/DashboardPage';
import IntegrationsPage from './pages/IntegrationsPage';

export default function App() {
  if (window.location.pathname === '/brands') return <BrandProfilesPage />;
  if (window.location.pathname === '/detection') return <DetectionLabPage />;
  if (window.location.pathname === '/social-monitoring') return <SocialMonitoringPage />;
  if (window.location.pathname === '/app-monitoring') return <AppMonitoringPage />;
  if (window.location.pathname === '/dashboard') return <DashboardPage />;
  if (window.location.pathname === '/integrations') return <IntegrationsPage />;
  return <HomePage />;
}
