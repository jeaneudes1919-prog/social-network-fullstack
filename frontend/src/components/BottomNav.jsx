import { NavLink } from 'react-router-dom';
import { Home, Search, MessageSquare, User } from 'lucide-react';

const BottomNav = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  const navLinks = [
    { icon: Home, path: "/" },
    { icon: Search, path: "/search" },
    { icon: MessageSquare, path: "/messages" },
    { icon: User, path: `/profile/${user?.id}` },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-secondary/90 backdrop-blur-lg border-t border-borderCol z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navLinks.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `
              p-3 rounded-2xl transition-all duration-300
              ${isActive ? 'text-accent bg-accent/10' : 'text-textSub'}
            `}
          >
            <item.icon size={28} />
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;