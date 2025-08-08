import React, { useState, useEffect } from 'react';
import './LogsManagement.css';

export default function LogsManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    limit: 10
  });
  
  // Filters - default values như trong ảnh
  const [filters, setFilters] = useState({
    startDate: '2025-07-25',
    endDate: '2025-07-29',
    actionType: 'all',
    userSearch: ''
  });
  
  const [actionTypes, setActionTypes] = useState([]);

  useEffect(() => {
    loadLogs();
    loadActionTypes();
  }, [pagination.currentPage, pagination.limit]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query string
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(filters.actionType !== 'all' && { action_type: filters.actionType }),
        ...(filters.userSearch && { user_search: filters.userSearch })
      });
      
      const response = await fetch(`/admin/logs?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(prev => ({
          ...prev,
          ...data.pagination
        }));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActionTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/admin/logs/action-types', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActionTypes(data.action_types);
      }
    } catch (error) {
      console.error('Error loading action types:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '2025-07-25',
      endDate: '2025-07-29',
      actionType: 'all',
      userSearch: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadLogs();
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && pagination.currentPage > 1) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    } else if (direction === 'next' && pagination.currentPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getActionBadgeClass = (actionType) => {
    const badgeMap = {
      'login': 'action-badge login',
      'uploaded_scan': 'action-badge uploaded-scan',
      'result_generated': 'action-badge result-generated',
      'user_created': 'action-badge user-created',
      'error': 'action-badge error'
    };
    return badgeMap[actionType] || 'action-badge default';
  };

  const getUserAvatar = (username) => {
    // Tạo avatar từ chữ cái đầu của tên
    const initials = username.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    return initials || 'U';
  };

  const getAvatarStyle = (username) => {
    // Tạo màu avatar dựa trên tên
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      backgroundColor: colors[hash % colors.length],
      color: 'white'
    };
  };

  if (loading && logs.length === 0) {
    return <div className="loading">Loading logs...</div>;
  }

  return (
    <div className="activity-page">
      {/* Header Section */}
      <div className="activity-header">
        <h1>Activity</h1>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters</h3>
          <button className="reset-filters-btn" onClick={resetFilters}>
            🔄 Reset filters
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Action Type</label>
            <select
              value={filters.actionType}
              onChange={(e) => handleFilterChange('actionType', e.target.value)}
            >
              <option value="all">All actions</option>
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>User</label>
            <input
              type="text"
              placeholder="Search by username"
              value={filters.userSearch}
              onChange={(e) => handleFilterChange('userSearch', e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button className="apply-filters-btn" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Section */}
      <div className="activity-logs-section">
        <div className="logs-header">
          <h3>Activity Logs</h3>
          <div className="logs-count">
            📊 Showing {Math.min(pagination.limit, pagination.totalLogs)} of {pagination.totalLogs.toLocaleString()} logs
          </div>
        </div>
        
        <div className="logs-table-container">
          <table className="activity-logs-table">
            <thead>
              <tr>
                <th>
                  <div className="th-content">
                    Timestamp 
                    <span className="sort-indicator">▼</span>
                  </div>
                </th>
                <th>User</th>
                <th>Action</th>
                <th>Description</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log._id || index}>
                  <td className="timestamp-cell">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="user-cell">
                    <div className="user-info">
                      <div 
                        className="user-avatar"
                        style={getAvatarStyle(log.username)}
                      >
                        {getUserAvatar(log.username)}
                      </div>
                      <span className="username">{log.username}</span>
                    </div>
                  </td>
                  <td className="action-cell">
                    <span className={getActionBadgeClass(log.action_type)}>
                      {log.action}
                    </span>
                  </td>
                  <td className="description-cell">
                    {log.description}
                  </td>
                  <td className="ip-cell">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && !loading && (
            <div className="no-logs">
              <p>No activity logs found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination-section">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select 
              value={pagination.limit}
              onChange={(e) => {
                setPagination(prev => ({ 
                  ...prev, 
                  limit: parseInt(e.target.value),
                  currentPage: 1 
                }));
                setTimeout(loadLogs, 100);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="page-range">
            {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalLogs)} of {pagination.totalLogs.toLocaleString()}
          </div>
          
          <div className="page-navigation">
            <button 
              className="page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange('prev')}
            >
              ‹
            </button>
            <button 
              className="page-btn"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange('next')}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}