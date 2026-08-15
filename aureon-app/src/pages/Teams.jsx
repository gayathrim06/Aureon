import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Users, Shield, FolderKanban, Terminal, Code2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Teams = () => {
  const { showToast } = useAuth();

  const squadMembers = [
    { name: 'Gayathri Ramesh', role: 'Project Manager', dept: 'Platform Core', email: 'gayathri@aureon.engineering', avatar: 'GR', status: 'online' },
    { name: 'David Vance', role: 'Senior Architect', dept: 'Cloud Mesh', email: 'david@aureon.engineering', avatar: 'DV', status: 'online' },
    { name: 'Sarah Chen', role: 'Team Lead', dept: 'Auth & IAM', email: 'sarah@aureon.engineering', avatar: 'SC', status: 'busy' },
    { name: 'Alex Rivera', role: 'Software Engineer', dept: 'Static Analysis', email: 'alex@aureon.engineering', avatar: 'AR', status: 'online' },
    { name: 'Elena Rostova', role: 'Security Analyst', dept: 'Vulnerability Engine', email: 'elena@aureon.engineering', avatar: 'ER', status: 'away' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">Engineering Teams & Workload</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Squad member allocation, roles, and review throughput</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => showToast('Invite Member modal opened', 'info')}>
          Add Team Member
        </Button>
      </div>

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
    </div>
  );
};
