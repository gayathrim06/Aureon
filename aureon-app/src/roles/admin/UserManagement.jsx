import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, UserX, Key, Shield, Trash2, Edit3, CheckCircle, RefreshCw } from 'lucide-react';

const DEFAULT_SEED_USERS = [
  { id: 1, name: 'Gayathri M', email: 'admin@aureon.com', role: 'ROLE_ADMIN', department: 'Engineering', status: 'ACTIVE', lastActive: 'Active Now' },
  { id: 2, name: 'Sarah Jenkins', email: 'manager@aureon.com', role: 'ROLE_PM', department: 'Product Management', status: 'ACTIVE', lastActive: '5m ago' },
  { id: 3, name: 'David Chen', email: 'lead@aureon.com', role: 'ROLE_LEAD', department: 'Backend Architecture', status: 'ACTIVE', lastActive: '12m ago' },
  { id: 4, name: 'Ram Kumar', email: 'ram.dev@aureon.com', role: 'ROLE_DEV', department: 'Frontend UI', status: 'ACTIVE', lastActive: '1h ago' },
  { id: 5, name: 'Venu QA', email: 'venu.qa@aureon.com', role: 'ROLE_QA', department: 'Quality Assurance', status: 'ACTIVE', lastActive: '2h ago' },
  { id: 6, name: 'Elena Rostova', email: 'elena.r@aureon.com', role: 'ROLE_DEV', department: 'DevOps & CI/CD', status: 'ACTIVE', lastActive: 'Yesterday' },
  { id: 7, name: 'Michael Brown', email: 'michael.b@aureon.com', role: 'ROLE_DEV', department: 'Security & Auth', status: 'ACTIVE', lastActive: 'Yesterday' },
];

export const UserManagement = ({ onShowToast }) => {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState(DEFAULT_SEED_USERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE, EDIT, RESET_PWD
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ROLE_DEV',
    department: 'Engineering',
    title: 'Full Stack Developer',
    status: 'ACTIVE'
  });

  const fetchUsersList = async () => {
    setIsLoading(true);
    const token = sessionStorage.getItem('aureon_jwt_access_token') || sessionStorage.getItem('aureon_access_token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/users/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const rawData = await res.json();
        const usersArray = Array.isArray(rawData)
          ? rawData
          : (rawData.results || rawData.users || rawData.data || []);
        
        if (usersArray.length > 0) {
          const formattedUsers = usersArray.map(u => ({
            ...u,
            id: u.id,
            name: u.full_name || u.username || u.email || 'User Account',
            email: u.email,
            role: u.role_code || u.role_name || (typeof u.role === 'string' ? u.role : u.role?.code) || 'ROLE_DEV',
            department: u.department || 'Engineering',
            status: u.account_status || (u.is_active !== false ? 'ACTIVE' : 'INACTIVE'),
            lastActive: u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'Active Now'
          }));
          setUsersList(formattedUsers);
        } else {
          setUsersList(DEFAULT_SEED_USERS);
        }
      } else {
        setUsersList(DEFAULT_SEED_USERS);
      }
    } catch (err) {
      console.error('Using default seed user directory telemetry:', err);
      setUsersList(DEFAULT_SEED_USERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', role: 'ROLE_DEV', department: 'Engineering', title: 'Full Stack Developer', status: 'ACTIVE', password: 'Aureon@123' });
    setModalMode('CREATE');
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const createdUser = {
      id: usersList.length + 1,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      status: formData.status,
      lastActive: 'Active Now'
    };

    setUsersList([createdUser, ...usersList]);
    setIsModalOpen(false);
    onShowToast && onShowToast({ type: 'success', title: 'User Created', message: `${formData.name} provisioned successfully.` });
  };

  const handleDeleteUser = (usr) => {
    setUsersList(usersList.filter(u => u.id !== usr.id));
    onShowToast && onShowToast({ type: 'info', title: 'User Deprovisioned', message: `${usr.name} removed from workspace.` });
  };

  const userColumns = [
    {
      header: 'USER NAME',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white font-bold text-xs flex items-center justify-center">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white warm:text-[#342314] text-xs">{row.name}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 warm:text-[#69523c] font-mono">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'RBAC ROLE',
      accessor: 'role',
      cell: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] border border-indigo-200 dark:border-indigo-800 warm:border-[#b8a074]">
          {row.role.replace('ROLE_', '')}
        </span>
      )
    },
    {
      header: 'DEPARTMENT',
      accessor: 'department',
      cell: (row) => <span className="text-xs text-slate-700 dark:text-slate-300 warm:text-[#342314]">{row.department}</span>
    },
    {
      header: 'STATUS',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${row.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'LAST ACTIVE',
      accessor: 'lastActive',
      cell: (row) => <span className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] font-mono">{row.lastActive}</span>
    },
    {
      header: 'ADMIN ACTIONS',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDeleteUser(row)}
            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
            title="Deprovision User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 warm:text-[#342314]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Breadcrumb activeTab="User Accounts Management" />
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsersList}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] text-slate-700 dark:text-slate-300 warm:text-[#342314] hover:opacity-90"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 warm:bg-[#b45309] warm:hover:bg-[#92400e] text-white text-xs font-bold shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Team Member
          </button>
        </div>
      </div>

      <DataTable
        columns={userColumns}
        data={usersList}
        searchPlaceholder="Search system accounts by name, email, department..."
      />

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New Team Member">
          <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 warm:bg-[#f3e8d2]"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Corporate Email</label>
              <input
                type="email"
                required
                placeholder="alex.rivera@aureon.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 warm:bg-[#f3e8d2]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">RBAC Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 warm:bg-[#f3e8d2]"
                >
                  <option value="ROLE_DEV">Developer</option>
                  <option value="ROLE_LEAD">Team Lead</option>
                  <option value="ROLE_PM">Project Manager</option>
                  <option value="ROLE_QA">QA Engineer</option>
                  <option value="ROLE_ADMIN">System Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 warm:bg-[#f3e8d2]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 warm:bg-[#b45309] text-white font-bold"
              >
                Provision User
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
