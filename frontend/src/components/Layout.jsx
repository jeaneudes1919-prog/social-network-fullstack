import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-primary text-textMain font-sans transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Fond d'ambiance (Glow effect) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* 1. Header Fixe */}
      <Navbar />

      {/* 2. Contenu Principal Centré (Focus Mode) */}
      <div className="pt-20 pb-24 md:pb-10 max-w-2xl mx-auto px-4 min-h-screen">
         <Outlet />
      </div>

      {/* 3. Nav Mobile Fixe en bas */}
      <BottomNav />
      
    </div>
  );
};

export default Layout;