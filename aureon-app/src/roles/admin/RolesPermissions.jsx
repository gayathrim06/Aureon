import React from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { initialRoles } from '../../services/mockData';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';

export const RolesPermissions = () => {
  const allPermissions = [
    { key: 'admin:all', name: 'Global Administrator Access', desc: 'Grants full unrestricted platform management.' },
    { key: 'users:manage', name: 'User Management', desc: 'Create, edit, deactivate, and delete user accounts.' },
    { key: 'rbac:manage', name: 'RBAC Policy Matrix', desc: 'Modify role permission tokens and access controls.' },
    { key: 'audit:view', name: 'Audit Trail Inspection', desc: 'View and export immutable security event logs.' },
    { key: 'projects:create', name: 'Project Creation', desc: 'Initialize software projects, budget allocations, and repositories.' },
    { key: 'sprints:manage', name: 'Sprint Management', desc: 'Plan, activate, and complete sprint cycles.' },
    { key: 'tasks:assign', name: 'Task Allocation', desc: 'Assign development and QA tasks to team members.' },
    { key: 'kanban:move', name: 'Kanban Board Drag-and-Drop', desc: 'Move cards between To-Do, In Progress, Code Review, and Done.' },
    { key: 'bugs:create', name: 'Bug Reporting & Evidence Upload', desc: 'Log issues, attach logs/screenshots, and set severity.' }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Roles & Permissions" />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" /> Role-Based Access Control (RBAC) Permission Matrix
        </h1>
        <p className="text-xs text-gray-500">
          Strict authorization definitions enforced by backend middleware and route guards across all 5 roles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialRoles.map((role) => (
          <div key={role.id} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                  {role.id}
                </span>
                <span className="text-xs text-gray-400 font-medium">Level {role.level}</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-2">{role.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{role.description}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Granted Token Permissions:</div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map(p => (
                    <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-mono text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
