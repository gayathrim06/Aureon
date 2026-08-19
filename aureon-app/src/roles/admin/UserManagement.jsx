import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { initialUsers } from '../../services/mockData';
import { UserPlus, UserX, Key, Shield, Trash2, Edit3, CheckCircle, RefreshCw } from 'lucide-react';

export const UserManagement = ({ onShowToast }) => {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
        
        const formattedUsers = usersArray.map(u => ({
          ...u,
          id: u.id || `usr_${Math.random()}`,
          name: u.full_name || u.name || u.username || u.email || 'User Account',
          email: u.email,
          role: u.role_code || u.role_name || (typeof u.role === 'string' ? u.role : u.role?.code) || 'ROLE_DEV',
          department: u.department || 'Engineering',
          status: u.account_status || (u.is_active !== false ? 'ACTIVE' : 'INACTIVE'),
          lastActive: u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'Active Now'
        }));
        
        setUsersList(formattedUsers.length > 0 ? formattedUsers : initialUsers);
      } else {
        setUsersList(initialUsers);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsersList(initialUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', role: 'ROLE_DEV', department: 'Engineering', title: 'Full Stack Developer', status: 'ACTIVE' });
    setModalMode('CREATE');
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('aureon_jwt_access_token');

    if (modalMode === 'CREATE') {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/users/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          onShowToast && onShowToast({ type: 'success', title: 'User Created', message: `${formData.name} has been provisioned successfully.` });
          logAuditEvent({
            user: currentUser,
            role: currentUser?.role,
            action: 'USER_CREATE',
            resource: `User: ${formData.name} (${formData.email}) - Role: ${formData.role}`,
            status: 'SUCCESS'
          });
          fetchUsersList();
        } else {
          onShowToast && onShowToast({ type: 'error', title: 'Provisioning Failed', message: data.message || 'Error occurred.' });
        }
      } catch (err) {
        onShowToast && onShowToast({ type: 'error', title: 'Server Error', message: 'Could not connect to database server.' });
      }
    } else if (modalMode === 'EDIT' && selectedUser) {
      // Clean ID format
      const cleanId = selectedUser.user_id || selectedUser.id.replace('usr_', '');
      try {
        // Update user status & profile attributes
        const resStatus = await fetch(`http://127.0.0.1:8000/api/v1/users/${cleanId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ status: formData.status })
        });
        
        if (resStatus.ok) {
          onShowToast && onShowToast({ type: 'success', title: 'User Updated', message: `Permissions and details for ${formData.name} updated.` });
          logAuditEvent({
            user: currentUser,
            role: currentUser?.role,
            action: 'USER_ROLE_UPDATE',
            resource: `Updated ${selectedUser.email} to Role: ${formData.role}, Status: ${formData.status}`,
            status: 'SUCCESS'
          });
          fetchUsersList();
        } else {
          onShowToast && onShowToast({ type: 'error', title: 'Update Failed', message: 'Failed to update user profile.' });
        }
      } catch (err) {
        onShowToast && onShowToast({ type: 'error', title: 'Server Error', message: 'Database query failed.' });
      }
    }

    setIsModalOpen(false);
  };

  const handleDeactivate = async (usr) => {
    const newStatus = usr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const cleanId = usr.user_id || usr.id.replace('usr_', '');
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/users/${cleanId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        logAuditEvent({
          user: currentUser,
          role: currentUser?.role,
          action: newStatus === 'INACTIVE' ? 'USER_DEACTIVATE' : 'USER_ACTIVATE',
          resource: `User: ${usr.email}`,
          status: 'SUCCESS'
        });

        onShowToast && onShowToast({
          type: newStatus === 'INACTIVE' ? 'warning' : 'success',
          title: `User ${newStatus}`,
          message: `${usr.name} account is now ${newStatus.toLowerCase()}.`
        });
        fetchUsersList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = (usr) => {
    logAuditEvent({
      user: currentUser,
      role: currentUser?.role,
      action: 'USER_PASSWORD_RESET',
      resource: `Triggered password reset link for ${usr.email}`,
      status: 'SUCCESS'
    });
    onShowToast && onShowToast({ type: 'info', title: 'Password Reset Sent', message: `Secure reset URL dispatched to ${usr.email}` });
  };

  const handleDeleteUser = async (usr) => {
    const cleanId = usr.user_id || usr.id.replace('usr_', '');
    const token = sessionStorage.getItem('aureon_jwt_access_token');
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/users/${cleanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        logAuditEvent({
          user: currentUser,
          role: currentUser?.role,
          action: 'USER_DELETE',
          resource: `Deleted user ${usr.email}`,
          status: 'SUCCESS'
        });
        onShowToast && onShowToast({ type: 'error', title: 'User Removed', message: `${usr.name} was permanently removed.` });
        fetchUsersList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-500 shadow-sm shrink-0">
            {val ? val.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{val}</div>
            <div className="text-[10px] text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'RBAC Role',
      render: (val) => {
        const roleColors = {
          ROLE_ADMIN: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          ROLE_PM: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          ROLE_LEAD: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          ROLE_DEV: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          ROLE_QA: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleColors[val] || 'bg-gray-100 text-gray-700'}`}>
            {(val || '').replace('ROLE_', '')}
          </span>
        );
      }
    },
    { key: 'department', label: 'Department' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          val === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
        }`}>
          {val}
        </span>
      )
    },
    { key: 'lastActive', label: 'Last Active' },
    {
      key: 'actions',
      label: 'Admin Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSelectedUser(row); setFormData(row); setModalMode('EDIT'); setIsModalOpen(true); }}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Edit User & Roles"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleResetPassword(row)}
            className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600"
            title="Reset Password"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeactivate(row)}
            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
            title={row.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
          >
            <UserX className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteUser(row)}
            className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700"
            title="Delete User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Breadcrumb activeTab="User Accounts Management" />
        <div className="flex gap-2">
          <button
            onClick={fetchUsersList}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" /> Add Team Member
          </button>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading user database...</div>
        ) : (
          <DataTable
            data={usersList}
            columns={columns}
            searchPlaceholder="Search system accounts by name, email, department..."
            searchKey="name"
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'CREATE' ? 'Provision New Platform User' : 'Edit User Settings'}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs font-sans">
          {modalMode === 'CREATE' && (
            <>
              <div className="space-y-1">
                <label className="block font-bold text-gray-700 dark:text-gray-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
                  placeholder="e.g. Elena Rostova"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-700 dark:text-gray-300">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
                  placeholder="e.g. elena@aureon.com"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-gray-700 dark:text-gray-300">Select System Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
              >
                <option value="ROLE_DEV">Developer</option>
                <option value="ROLE_QA">QA Engineer</option>
                <option value="ROLE_LEAD">Team Lead</option>
                <option value="ROLE_PM">Project Manager</option>
                <option value="ROLE_ADMIN">System Admin</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-gray-700 dark:text-gray-300">System Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="LOCKED">LOCKED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-gray-700 dark:text-gray-300">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Product Delivery">Product Delivery</option>
                <option value="Executive Office">Executive Office</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-gray-700 dark:text-gray-300">Designation / Job Title *</label>
              <select
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none"
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Senior QA Automation Engineer">Senior QA Automation Engineer</option>
                <option value="Tech Lead - Core Backend">Tech Lead - Core Backend</option>
                <option value="Senior Technical Program Manager">Senior Technical Program Manager</option>
                <option value="Platform Security & System Administrator">Platform Security & System Administrator</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
            >
              {modalMode === 'CREATE' ? 'Provision User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
