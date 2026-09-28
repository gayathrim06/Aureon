import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Users, Shield, FolderKanban, Terminal, Code2, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

export const Teams = () => {
  const { showToast } = useAuth();
  const [squadMembers, setSquadMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/');
      if (res?.success && Array.isArray(res?.data)) {
        const formatted = res.data.map(u => ({
          name: u.full_name || u.name || u.username || 'Engineer',
          role: u.designation || u.role_name || u.role_code || 'Software Engineer',
          dept: u.department || 'Engineering',
          email: u.email,
          avatar: (u.full_name || u.username || 'A').substring(0, 2).toUpperCase(),
          status: u.is_active ? 'online' : 'away'
        }));
        setSquadMembers(formatted);
      }
    } catch (e) {
      console.error('Error fetching members:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Engineering Teams & Workload</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Live squad member allocation from PostgreSQL user directory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchMembers} isLoading={loading}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => showToast('Invite Member modal opened', 'info')}>
            Add Team Member
          </Button>
        </div>
      </div>

      {squadMembers.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400">
          No team members registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {squadMembers.map((m, idx) => (
            <Card key={idx} hoverEffect>
              <div className="flex items-start gap-4">
                <Avatar name={m.name} size="lg" status={m.status} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#F8FAFC] truncate">{m.name}</h4>
                  <p className="text-xs text-[#38BDF8] font-medium">{m.role}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{m.email}</p>
                  <Badge variant="neutral" size="sm" className="mt-2">{m.dept}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
