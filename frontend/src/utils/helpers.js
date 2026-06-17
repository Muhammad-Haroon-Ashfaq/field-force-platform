export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'super_admin': return 'bg-purple-100 text-purple-700';
    case 'company_admin': return 'bg-blue-100 text-blue-700';
    case 'manager': return 'bg-green-100 text-green-700';
    case 'employee': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'inactive': return 'bg-red-100 text-red-700';
    case 'synced': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'draft': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};