import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { initialUsers, initialRoles } from '../../services/mockData';
import { logAuditEvent } from '../../services/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, UserX, Key, Shield, Trash2, Edit3, CheckCircle, RefreshCw } from 'lucide-react';

export const UserManagement = ({ onShowToast }) => {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE, EDIT, RESET_PWD
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ROLE_DEV',
    department: 'Engineering',
    title: 'Software Developer',
    status: 'ACTIVE'
  });

  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', role: 'ROLE_DEV', department: 'Engineering', title: 'Software Developer', status: 'ACTIVE' });
    setModalMode('CREATE');
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = (e) => {
    e.preventDefault();

    if (modalMode === 'CREATE') {
      const newUser = {
        id: `usr_${Date.now()}`,
        ...formData,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastActive: 'Just created',
        online: false,
        failedLogins: 0,
        mfaEnabled: false
      };
      setUsersList([newUser, ...usersList]);

      logAuditEvent({
        user: currentUser,
        role: currentUser?.role,
        action: 'USER_CREATE',
        resource: `User: ${newUser.name} (${newUser.email}) - Role: ${newUser.role}`,
        status: 'SUCCESS'
      });

      onShowToast && onShowToast({ type: 'success', title: 'User Created', message: `${newUser.name} has been provisioned successfully.` });
    } else if (modalMode === 'EDIT' && selectedUser) {
      setUsersList(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
      
      logAuditEvent({
        user: currentUser,
        role: currentUser?.role,
        action: 'USER_ROLE_UPDATE',
        resource: `Updated ${selectedUser.email} to Role: ${formData.role}, Status: ${formData.status}`,
        status: 'SUCCESS'
      });

      onShowToast && onShowToast({ type: 'success', title: 'User Updated', message: `Permissions and details for ${formData.name} updated.` });
    }

    setIsModalOpen(false);
  };

  const handleDeactivate = (usr) => {
    const newStatus = usr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUsersList(prev => prev.map(u => u.id === usr.id ? { ...u, status: newStatus } : u));

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

  const handleDeleteUser = (usr) => {
    setUsersList(prev => prev.filter(u => u.id !== usr.id));
    logAuditEvent({
      user: currentUser,
      role: currentUser?.role,
      action: 'USER_DELETE',
      resource: `Deleted user ${usr.email}`,
      status: 'SUCCESS'
    });
    onShowToast && onShowToast({ type: 'error', title: 'User Removed', message: `${usr.name} was permanently removed.` });
  };

  const columns = [
    {
      key: 'name',
      label: 'User Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <img src={row.avatar} alt={val} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
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
            {val.replace('ROLE_', '')}
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
      <Breadcrumb activeTab="Users" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">User Management & Provisioning</h1>
          <p className="text-xs text-gray-500">Assign roles, manage access status, reset credentials, and audit user permissions.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Provision New User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={usersList}
        searchPlaceholder="Search users by name, email, department..."
        bulkActions={[
          { label: 'Bulk Deactivate', onClick: (ids) => {
            setUsersList(prev => prev.map(u => ids.includes(u.id) ? { ...u, status: 'INACTIVE' } : u));
            onShowToast && onShowToast({ type: 'warning', title: 'Bulk Action', message: `Deactivated ${ids.length} selected users.` });
          }}
        ]}
      />

      {/* User Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'CREATE' ? 'Provision New User' : `Edit User: ${selectedUser?.name}`}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">Cancel</button>
            <button onClick={handleCreateOrUpdate} className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              {modalMode === 'CREATE' ? 'Provision User' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Corporate Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              placeholder="john@aureon.io"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Assigned RBAC Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              >
                {initialRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
