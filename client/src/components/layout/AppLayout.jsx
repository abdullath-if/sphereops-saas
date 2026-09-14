import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TaskModal from '../tasks/TaskModal';
import ProjectModal from '../projects/ProjectModal';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [showQuickProject, setShowQuickProject] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar onCloseMobile={() => setMobileOpen(false)} />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full z-10 animate-in slide-in-from-left duration-200">
            <Sidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onOpenMobile={() => setMobileOpen(true)}
          onQuickCreateTask={() => setShowQuickTask(true)}
          onQuickCreateProject={() => setShowQuickProject(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Quick Action Modals */}
      {showQuickTask && (
        <TaskModal
          isOpen={showQuickTask}
          onClose={() => setShowQuickTask(false)}
          onSuccess={() => {
            setShowQuickTask(false);
            window.dispatchEvent(new CustomEvent('task:created'));
          }}
        />
      )}

      {showQuickProject && (
        <ProjectModal
          isOpen={showQuickProject}
          onClose={() => setShowQuickProject(false)}
          onSuccess={() => {
            setShowQuickProject(false);
            window.dispatchEvent(new CustomEvent('project:created'));
          }}
        />
      )}
    </div>
  );
};

export default AppLayout;
