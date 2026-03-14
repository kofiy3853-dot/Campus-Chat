export const formatLastSeen = (date: string | Date | undefined): string => {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const lastSeen = new Date(date);
  const diffInMs = now.getTime() - lastSeen.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  if (diffInHours < 24) {
    const isToday = now.toDateString() === lastSeen.toDateString();
    if (isToday) {
        return `Today at ${lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === lastSeen.toDateString();
  if (isYesterday) {
      return `Yesterday at ${lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return lastSeen.toLocaleDateString([], { month: 'short', day: 'numeric', year: lastSeen.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};
