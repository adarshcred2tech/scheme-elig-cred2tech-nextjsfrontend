'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/services/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export type UserType = 'agent' | 'admin' | null;

interface Notification {
  id: string;
  type: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

export function useSocket(userType: UserType) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Connect to socket
  useEffect(() => {
    if (!userType || typeof window === 'undefined') return;

    const token = getToken(userType);
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    // Connection events
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log(`${userType} socket connected`);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log(`${userType} socket disconnected`);
    });

    socketInstance.on('connect_error', (error: any) => {
      setConnectionError(error.message);
      console.error('Socket connection error:', error);
    });

    socketInstance.on('connection:success', (data: any) => {
      console.log('Connection success:', data);
    });

    socketInstance.on('connection:error', (data: any) => {
      setConnectionError(data.message);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [userType]);

  // Listen for notifications
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNotification = (data: any) => {
      const notification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        type: data.type || 'INFO',
        message: data.message,
        data: data.data,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };
      
      setNotifications((prev) => [notification, ...prev]);
    };

    // Common events for both agent and admin
    socket.on('notification', handleNotification);
    socket.on('case:status:updated', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('case:status:updated', handleNotification);
    };
  }, [userType]);

  // Join case room
  const joinCaseRoom = useCallback((caseId: string) => {
    socketRef.current?.emit('case:join', { caseId });
  }, []);

  // Leave case room
  const leaveCaseRoom = useCallback((caseId: string) => {
    socketRef.current?.emit('case:leave', { caseId });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    notifications,
    joinCaseRoom,
    leaveCaseRoom,
    markAsRead,
    clearNotifications,
  };
}

// Agent-specific socket hook
export function useAgentSocket() {
  const { socket, isConnected, notifications, joinCaseRoom, leaveCaseRoom, markAsRead, clearNotifications } = useSocket('agent');
  const [assignedCases, setAssignedCases] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for case assignments
    socket.on('case:assigned', (data) => {
      console.log('New case assigned:', data);
      setAssignedCases((prev) => [data.data, ...prev]);
    });

    socket.on('case:reassigned:to', (data) => {
      console.log('Case reassigned to you:', data);
      setAssignedCases((prev) => [data.data, ...prev]);
    });

    socket.on('case:reassigned:from', (data) => {
      console.log('Case reassigned from you:', data);
      setAssignedCases((prev) => prev.filter((c) => c.id !== data.data.id));
    });

    // Listen for approval
    socket.on('agent:approved', (data) => {
      console.log('Registration approved:', data);
    });

    socket.on('agent:rejected', (data) => {
      console.log('Registration rejected:', data);
    });

    socket.on('agent:status:changed', (data) => {
      console.log('Status changed:', data);
      if (data.data.newStatus === 'BLOCKED' || data.data.newStatus === 'SUSPENDED') {
        // Handle account block - redirect to login
        window.location.href = '/agent/login';
      }
    });

    return () => {
      socket.off('case:assigned');
      socket.off('case:reassigned:to');
      socket.off('case:reassigned:from');
      socket.off('agent:approved');
      socket.off('agent:rejected');
      socket.off('agent:status:changed');
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    notifications,
    assignedCases,
    setAssignedCases,
    joinCaseRoom,
    leaveCaseRoom,
    markAsRead,
    clearNotifications,
  };
}

// Admin-specific socket hook
export function useAdminSocket() {
  const { socket, isConnected, notifications, markAsRead, clearNotifications } = useSocket('admin');
  const [stats, setStats] = useState<any>(null);
  const [pendingAgents, setPendingAgents] = useState<any[]>([]);
  const [newCases, setNewCases] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Subscribe to dashboard stats
    socket.emit('admin:dashboard:stats:subscribe');

    // Listen for new agent registrations
    socket.on('agent:registered', (data) => {
      console.log('New agent registered:', data);
      setPendingAgents((prev) => [data.data, ...prev]);
    });

    // Listen for new cases
    socket.on('case:created', (data) => {
      console.log('New case created:', data);
      setNewCases((prev) => [data.data, ...prev]);
    });

    // Listen for case assignments
    socket.on('case:assigned:admin', (data) => {
      console.log('Case assigned:', data);
    });

    // Listen for stats updates
    socket.on('admin:dashboard:stats:updated', (data) => {
      setStats(data.data);
    });

    // Listen for agent status changes
    socket.on('agent:status:changed:admin', (data) => {
      console.log('Agent status changed:', data);
    });

    return () => {
      socket.off('agent:registered');
      socket.off('case:created');
      socket.off('case:assigned:admin');
      socket.off('admin:dashboard:stats:updated');
      socket.off('agent:status:changed:admin');
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    notifications,
    stats,
    pendingAgents,
    setPendingAgents,
    newCases,
    setNewCases,
    markAsRead,
    clearNotifications,
  };
}
