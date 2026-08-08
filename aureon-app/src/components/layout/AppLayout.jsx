import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { Toast } from '../common/Toast';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Search, FolderKanban, GitBranch, Users, CheckSquare, ShieldCheck, ArrowRight } from 'lucide-react';

export const AppLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toastMessage, setToastMessage } = useAuth();
  const navigate = useNavigate();

  // Cmd/Ctrl + K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = [
    { title: 'Aureon Core API Gateway', category: 'Project', path: '/projects', icon: FolderKanban },
    { title: 'aureon-core-service', category: 'Repository', path: '/repositories', icon: GitBranch },
    { title: 'Gayathri Ramesh (Project Manager)', category: 'Team Member', path: '/teams', icon: Users },
    { title: 'Static Code Quality Analysis', category: 'Code Quality', path: '/code-quality', icon: ShieldCheck },
    { title: 'Migrate JWT token validation to Rust', category: 'Task', path: '/tasks', icon: CheckSquare },
  ].filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        <TopNavbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSearchModal={() => setIsSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Toast Notifications */}
      <Toast toast={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Cmd + K Global Search Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Global Engineering Search"
        subtitle="Quick jump to projects, repositories, tasks, or code health reports"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            autoFocus
            icon={Search}
            placeholder="Type a command or search query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="divide-y divide-[#334155]/60 max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((res, idx) => {
                const Icon = res.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(res.path);
                    }}
                    className="flex items-center justify-between p-3 hover:bg-[#273549] rounded-[12px] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#111827] text-[#2563EB] rounded-[8px] border border-[#334155]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#F8FAFC]">{res.title}</h4>
                        <span className="text-[10px] font-semibold uppercase text-[#38BDF8]">{res.category}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#94A3B8]">
                No engineering records found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
