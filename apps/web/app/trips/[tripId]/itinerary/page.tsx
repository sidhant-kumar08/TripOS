'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  ListTodo,
  Trash2,
  User,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { useAuth } from '@/lib/auth-context';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDateTime, formatDate } from '@/lib/utils';

interface Activity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
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

  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'activities' | 'tasks'>('activities');

  // Add Activity Modal State
  const [isAddActivityOpen, setIsAddActivityOpen] = React.useState(false);
  const [isSubmittingActivity, setIsSubmittingActivity] = React.useState(false);
  const [activityTitle, setActivityTitle] = React.useState('');
  const [activityDesc, setActivityDesc] = React.useState('');
  const [activityLocation, setActivityLocation] = React.useState('');
  const [activityStart, setActivityStart] = React.useState('');
  const [activityEnd, setActivityEnd] = React.useState('');
  const [activityError, setActivityError] = React.useState('');

  // Add Task Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskDueDate, setTaskDueDate] = React.useState('');
  const [taskAssignedTo, setTaskAssignedTo] = React.useState('');
  const [taskError, setTaskError] = React.useState('');

  const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return { Authorization: `Bearer ${token}` };
  };

  React.useEffect(() => {
    if (user && tripId) {
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

      setActivities(activitiesRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim() || !activityStart || !activityEnd) return;

    try {
      setIsSubmittingActivity(true);
      setActivityError('');
      const config = { headers: getAuthHeader() };

      await axios.post(
        `${API_BASE_URL}/trips/${tripId}/activities`,
        {
          title: activityTitle.trim(),
          description: activityDesc.trim() || undefined,
          location: activityLocation.trim() || undefined,
          startTime: new Date(activityStart).toISOString(),
          endTime: new Date(activityEnd).toISOString(),
        },
        config
      );

      setIsAddActivityOpen(false);
      resetActivityForm();
      fetchData();
    } catch (error: any) {
      setActivityError(error.response?.data?.message || 'Failed to add activity');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      setIsSubmittingTask(true);
      setTaskError('');
      const config = { headers: getAuthHeader() };

      await axios.post(
        `${API_BASE_URL}/trips/${tripId}/tasks`,
        {
          title: taskTitle.trim(),
          dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
          assignedTo: taskAssignedTo.trim() || undefined,
        },
        config
      );

      setIsAddTaskOpen(false);
      resetTaskForm();
      fetchData();
    } catch (error: any) {
      setTaskError(error.response?.data?.message || 'Failed to add task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/activities/${activityId}`, config);
      fetchData();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/tasks/${taskId}`, config);
      fetchData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const resetActivityForm = () => {
    setActivityTitle('');
    setActivityDesc('');
    setActivityLocation('');
    setActivityStart('');
    setActivityEnd('');
    setActivityError('');
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDueDate('');
    setTaskAssignedTo('');
    setTaskError('');
  };

  return (
    <PageShell
      title="Trip Itinerary & Tasks"
      subtitle="Organize day-by-day activities, reservations, and group responsibilities."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trip Overview', href: `/trips/${tripId}` },
        { label: 'Itinerary' },
      ]}
      actions={
        activeTab === 'activities' ? (
          <Button onClick={() => setIsAddActivityOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Activity
          </Button>
        ) : (
          <Button onClick={() => setIsAddTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        )
      }
    >
      {/* Tab Switcher */}
      <div className="mb-6 flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80 w-fit">
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'activities'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Timeline Activities ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'tasks'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ListTodo className="h-3.5 w-3.5" />
          Task Commitments ({tasks.length})
        </button>
      </div>

      {/* ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          {loading ? (
            <div className="trip-glass-card rounded-2xl p-8 text-center animate-pulse">
              <p className="text-sm text-slate-500">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title="No activities planned yet"
              description="Add flight arrivals, dinner reservations, boat trips, or sightseeing to keep everyone in sync."
              actionLabel="+ Add First Activity"
              onAction={() => setIsAddActivityOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="trip-glass-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-inner">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {activity.title}
                      </h4>
                      {activity.description && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {activity.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {activity.location && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                            {activity.location}
                          </span>
                        )}
                        <span>•</span>
                        <span>{formatDateTime(activity.startTime)} → {new Date(activity.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                      title="Delete activity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {loading ? (
            <div className="trip-glass-card rounded-2xl p-8 text-center animate-pulse">
              <p className="text-sm text-slate-500">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<ListTodo className="h-8 w-8" />}
              title="No tasks assigned yet"
              description="Assign packing items, reservation bookings, or logistics to specific trip members."
              actionLabel="+ Add First Task"
              onAction={() => setIsAddTaskOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="trip-glass-card rounded-2xl p-4 flex items-center justify-between gap-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700">
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {task.assignedTo && (
                          <span className="flex items-center gap-1 font-medium">
                            <User className="h-3 w-3" /> {task.assignedTo}
                          </span>
                        )}
                        {task.dueDate && (
                          <span>• Due: {formatDate(task.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        task.status === 'COMPLETED'
                          ? 'success'
                          : task.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {task.status}
                    </Badge>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD ACTIVITY MODAL */}
      <Modal
        isOpen={isAddActivityOpen}
        onClose={() => {
          setIsAddActivityOpen(false);
          resetActivityForm();
        }}
        title="Add Activity to Timeline"
        description="Schedule a plan, reservation, or highlight for the trip."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4 mt-2">
          {activityError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
              {activityError}
            </div>
          )}

          <Input
            label="Activity Title *"
            placeholder="e.g. Sunset Boat Cruise to Blue Grotto ⛵"
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
            icon={<Calendar className="h-4 w-4 text-slate-400" />}
            required
          />

          <Input
            label="Location (Optional)"
            placeholder="e.g. Marina Grande Dock #4"
            value={activityLocation}
            onChange={(e) => setActivityLocation(e.target.value)}
            icon={<MapPin className="h-4 w-4 text-slate-400" />}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="datetime-local"
              label="Start Time *"
              value={activityStart}
              onChange={(e) => setActivityStart(e.target.value)}
              required
            />
            <Input
              type="datetime-local"
              label="End Time *"
              value={activityEnd}
              onChange={(e) => setActivityEnd(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Details / Notes"
            placeholder="e.g. Bring towels, sunglasses, and dry bags. Captain contact: +39 081 123456"
            value={activityDesc}
            onChange={(e) => setActivityDesc(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddActivityOpen(false);
                resetActivityForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmittingActivity}
            >
              Save Activity
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD TASK MODAL */}
      <Modal
        isOpen={isAddTaskOpen}
        onClose={() => {
          setIsAddTaskOpen(false);
          resetTaskForm();
        }}
        title="Add Group Task"
        description="Delegate preparation, bookings, or packing responsibilities."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
          {taskError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
              {taskError}
            </div>
          )}

          <Input
            label="Task Description *"
            placeholder="e.g. Book return airport taxi"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            icon={<ListTodo className="h-4 w-4 text-slate-400" />}
            required
          />

          <Input
            type="date"
            label="Due Date"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
          />

          <Input
            type="email"
            label="Assignee Email"
            placeholder="friend@example.com"
            value={taskAssignedTo}
            onChange={(e) => setTaskAssignedTo(e.target.value)}
            icon={<User className="h-4 w-4 text-slate-400" />}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddTaskOpen(false);
                resetTaskForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmittingTask}
            >
              Add Task
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
