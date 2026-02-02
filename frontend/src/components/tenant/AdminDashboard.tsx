/**
 * Admin Dashboard Component
 * Central management interface for all tenant operations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BankManagement } from './BankManagement';
import { BranchManagement } from './BranchManagement';
import { TenantUserManagement } from './TenantUserManagement';
import { Bank, Branch, TenantUser } from '../../types/tenant';
import { tenantApi } from '../../services/tenantApi';
import { toast } from '../../hooks/use-toast';
import { 
  Building2, 
  MapPin, 
  Users, 
  Settings, 
  BarChart3, 
  Database,
  Activity,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalBanks: 0,
    totalBranches: 0,
    totalUsers: 0,
    activeBanks: 0,
    activeBranches: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    services: 'healthy'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState<number | undefined>();
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivity(),
        checkSystemHealth()
      ]);
    } catch (error) {
      toast({
        title: "Error loading dashboard",
        description: `Failed to load dashboard data: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const banksResponse = await tenantApi.getBanks();
      const banks = banksResponse.data || [];
      
      let totalBranches = 0;
      let activeBranches = 0;
      
      for (const bank of banks) {
        const branchesResponse = await tenantApi.getBranches(bank.id);
        const branches = branchesResponse.data || [];
        totalBranches += branches.length;
        activeBranches += branches.filter(b => b.is_active).length;
      }

      const usersResponse = await tenantApi.getTenantUsers();
      const users = usersResponse.data || [];

      setStats({
        totalBanks: banks.length,
        totalBranches,
        totalUsers: users.length,
        activeBanks: banks.filter(b => b.is_active).length,
        activeBranches,
        activeUsers: users.filter(u => u.is_active).length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    // Simulated recent activity - in real app, this would come from audit logs
    setRecentActivity([
      {
        id: 1,
        action: 'Bank Created',
        description: 'HDFC Bank added to system',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'bank',
        status: 'success'
      },
      {
        id: 2,
        action: 'Branch Updated',
        description: 'Anna Nagar Branch operational hours modified',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        type: 'branch',
        status: 'info'
      },
      {
        id: 3,
        action: 'User Created',
        description: 'New appraiser added to Chennai Branch',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        type: 'user',
        status: 'success'
      },
      {
        id: 4,
        action: 'Configuration Updated',
        description: 'Loan limits updated for SBI Bank',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        type: 'config',
        status: 'warning'
      }
    ]);
  };

  const checkSystemHealth = async () => {
    try {
      // Simulate system health check
      setSystemHealth({
        database: 'healthy',
        api: 'healthy',
        services: 'healthy'
      });
    } catch (error) {
      setSystemHealth({
        database: 'error',
        api: 'error',
        services: 'error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'branch':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'config':
        return <Settings className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Comprehensive tenant management and system overview</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Banks</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalBanks}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeBanks} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalBranches}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeBranches} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activity</p>
                <p className="text-2xl font-bold text-orange-600">{recentActivity.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Recent actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Status</p>
                <p className="text-2xl font-bold text-cyan-600">OK</p>
              </div>
              <Database className="w-8 h-8 text-cyan-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Database healthy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(systemHealth).map(([component, status]) => (
              <div key={component} className="flex items-center justify-between">
                <span className="capitalize font-medium">{component}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="text-sm text-gray-600 capitalize">{status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <h4 className="font-medium">{activity.action}</h4>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      <Badge 
                        variant={activity.status === 'success' ? 'default' : 
                                activity.status === 'warning' ? 'secondary' : 'destructive'}
                        className="ml-2 text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Tenant Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="banks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="banks" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Banks
              </TabsTrigger>
              <TabsTrigger value="branches" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Branches
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="banks">
              <BankManagement 
                selectedBankId={selectedBankId}
                onBankChange={(bank) => {
                  setSelectedBankId(bank?.id);
                  setSelectedBranchId(undefined);
                }}
              />
            </TabsContent>

            <TabsContent value="branches">
              <BranchManagement 
                selectedBankId={selectedBankId}
                selectedBranchId={selectedBranchId}
                onBranchChange={(branch) => {
                  setSelectedBranchId(branch?.id);
                  if (branch) {
                    setSelectedBankId(branch.bank_id);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="users">
              <TenantUserManagement 
                selectedBankId={selectedBankId}
                selectedBranchId={selectedBranchId}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;