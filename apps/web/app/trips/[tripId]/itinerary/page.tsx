'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { PageShell } from '@/components/ui/page-shell';
import { Card } from '@/components/ui/controls';

interface Activity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  participantCount?: number;
}

interface Task {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo?: string;
  dueDate?: string;
  creatorId: string;
}

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activities' | 'tasks'>('activities');

  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [newActivityLocation, setNewActivityLocation] = useState('');
  const [newActivityStart, setNewActivityStart] = useState('');
  const [newActivityEnd, setNewActivityEnd] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: getAuthHeader() };

      const [activitiesRes, tasksRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/trips/${tripId}/activities`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/trips/${tripId}/tasks`, config).catch(() => ({ data: [] })),
      ]);

      setActivities(activitiesRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || !newActivityStart || !newActivityEnd) return;

    try {
      const config = { headers: getAuthHeader() };
      await axios.post(
        `${API_BASE_URL}/trips/${tripId}/activities`,
        {
          title: newActivityTitle,
          description: newActivityDesc,
          location: newActivityLocation,
          startTime: new Date(newActivityStart).toISOString(),
          endTime: new Date(newActivityEnd).toISOString(),
        },
        config,
      );

      setNewActivityTitle('');
      setNewActivityDesc('');
      setNewActivityLocation('');
      setNewActivityStart('');
      setNewActivityEnd('');
      fetchData();
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const config = { headers: getAuthHeader() };
      await axios.post(
        `${API_BASE_URL}/trips/${tripId}/tasks`,
        {
          title: newTaskTitle,
          dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
          assignedTo: newTaskAssignedTo || undefined,
        },
        config,
      );

      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskAssignedTo('');
      fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Delete this activity?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/activities/${activityId}`, config);
      fetchData();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/tasks/${taskId}`, config);
      fetchData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading itinerary...</div>;
  }

  return (
    <PageShell title="Trip Itinerary" subtitle="Plan activities and assign tasks for the trip.">
      <div className="mb-8 flex gap-3 rounded-full border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur w-fit">
        <button onClick={() => setActiveTab('activities')} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'activities' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:text-slate-900'}`}>
          Activities
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:text-slate-900'}`}>
          Tasks
        </button>
      </div>

      {activeTab === 'activities' && (
        <div className="space-y-6">
          <Card>
            <form onSubmit={handleCreateActivity}>
              <h2 className="text-lg font-semibold text-slate-900">Add Activity</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input type="text" placeholder="Activity title" value={newActivityTitle} onChange={(e) => setNewActivityTitle(e.target.value)} className="trip-input" required />
                <input type="text" placeholder="Location" value={newActivityLocation} onChange={(e) => setNewActivityLocation(e.target.value)} className="trip-input" />
                <input type="datetime-local" value={newActivityStart} onChange={(e) => setNewActivityStart(e.target.value)} className="trip-input" required />
                <input type="datetime-local" value={newActivityEnd} onChange={(e) => setNewActivityEnd(e.target.value)} className="trip-input" required />
                <textarea placeholder="Description" value={newActivityDesc} onChange={(e) => setNewActivityDesc(e.target.value)} className="trip-input md:col-span-2" rows={3} />
              </div>
              <button type="submit" className="trip-button mt-5">Add Activity</button>
            </form>
          </Card>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <Card className="text-center text-slate-500">No activities yet</Card>
            ) : (
              activities.map((activity) => (
                <Card key={activity.id} className="trip-card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{activity.title}</h3>
                      {activity.description && <p className="mt-1 text-sm text-slate-600">{activity.description}</p>}
                      {activity.location && <p className="mt-1 text-sm text-slate-500">📍 {activity.location}</p>}
                      <div className="mt-3 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                        {new Date(activity.startTime).toLocaleString()} → {new Date(activity.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteActivity(activity.id)} className="trip-button-secondary px-3 py-2 text-xs text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <Card>
            <form onSubmit={handleCreateTask}>
              <h2 className="text-lg font-semibold text-slate-900">Add Task</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input type="text" placeholder="Task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="trip-input md:col-span-2" required />
                <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="trip-input" />
                <input type="text" placeholder="Assign to (email)" value={newTaskAssignedTo} onChange={(e) => setNewTaskAssignedTo(e.target.value)} className="trip-input" />
              </div>
              <button type="submit" className="trip-button mt-5">Add Task</button>
            </form>
          </Card>

          <div className="space-y-4">
            {tasks.length === 0 ? (
              <Card className="text-center text-slate-500">No tasks yet</Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="trip-card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className={`trip-badge ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {task.status}
                        </span>
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="trip-button-secondary px-3 py-2 text-xs text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
