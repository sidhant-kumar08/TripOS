'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  Circle,
  ListTodo,
  Trash2,
  User,
  CheckSquare,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';
import { itineraryApi, tasksApi, tripsApi } from '@/lib/api';
import { AIQuickTaskBar } from '@/components/ai/ai-quick-task-bar';

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

interface TripMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface TripDetails {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  members?: TripMember[];
}

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [trip, setTrip] = React.useState<TripDetails | null>(null);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'activities' | 'tasks'>('activities');
  const [taskFilter, setTaskFilter] = React.useState<'ALL' | 'OPEN' | 'COMPLETED'>('ALL');

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

  React.useEffect(() => {
    if (user && tripId) {
      fetchData();
    }
  }, [user, tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripRes, activitiesRes, tasksRes] = await Promise.all([
        tripsApi.getById(tripId).catch(() => ({ data: null })),
        itineraryApi.list(tripId).catch(() => ({ data: [] })),
        tasksApi.list(tripId).catch(() => ({ data: [] })),
      ]);

      if (tripRes.data) setTrip(tripRes.data);
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

      await itineraryApi.create(tripId, {
        title: activityTitle.trim(),
        description: activityDesc.trim() || undefined,
        location: activityLocation.trim() || undefined,
        startTime: new Date(activityStart).toISOString(),
        endTime: new Date(activityEnd).toISOString(),
      });

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

      await tasksApi.create(tripId, {
        title: taskTitle.trim(),
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        assignedTo: taskAssignedTo.trim() || undefined,
      });

      setIsAddTaskOpen(false);
      resetTaskForm();
      fetchData();
    } catch (error: any) {
      setTaskError(error.response?.data?.message || 'Failed to add task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await tasksApi.update(tripId, task.id, { status: nextStatus });
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert on error
      fetchData();
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await itineraryApi.delete(tripId, activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.delete(tripId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
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

  const openAddActivityForDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dateFormatted = d.toISOString().split('T')[0];
    setActivityStart(`${dateFormatted}T09:00`);
    setActivityEnd(`${dateFormatted}T11:00`);
    setIsAddActivityOpen(true);
  };

  // Group activities chronologically by day
  const groupedActivities = React.useMemo(() => {
    const sorted = [...activities].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const groups: { dateKey: string; dateLabel: string; dayIndex?: number; items: Activity[] }[] = [];
    const tripStart = trip?.startDate ? new Date(trip.startDate) : null;

    sorted.forEach((act) => {
      const actDate = new Date(act.startTime);
      const dateKey = actDate.toISOString().split('T')[0];

      let existing = groups.find((g) => g.dateKey === dateKey);
      if (!existing) {
        let dayIndex: number | undefined;
        if (tripStart) {
          const diffDays = Math.floor((actDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          if (diffDays >= 1 && diffDays <= 365) {
            dayIndex = diffDays;
          }
        }

        const dateLabel = actDate.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        existing = { dateKey, dateLabel, dayIndex, items: [] };
        groups.push(existing);
      }
      existing.items.push(act);
    });

    return groups;
  }, [activities, trip]);

  // Duration helper
  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return null;
    const diffMins = Math.round((e - s) / (1000 * 60));
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  // Task filtering and stats
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const openTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'OPEN') return t.status !== 'COMPLETED';
    if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Resolve assignee member display
  const getAssigneeInfo = (assignedValue?: string) => {
    if (!assignedValue) return null;
    if (!trip?.members) return { name: assignedValue, avatar: null };
    const member = trip.members.find(
      (m) => m.user.id === assignedValue || m.user.email.toLowerCase() === assignedValue.toLowerCase()
    );
    if (member) {
      return { name: member.user.name || member.user.email, avatar: member.user.avatar };
    }
    return { name: assignedValue, avatar: null };
  };

  return (
    <PageShell
      title="Trip Itinerary & Tasks"
      subtitle="Organize day-by-day activities, schedule events, and manage collaborative commitments."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip?.title || 'Trip Overview', href: `/trips/${tripId}` },
        { label: 'Itinerary & Tasks' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'activities' ? (
            <Button onClick={() => setIsAddActivityOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Activity
            </Button>
          ) : (
            <Button onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Task
            </Button>
          )}
        </div>
      }
    >
      {/* Tab Header Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'activities'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Day-by-Day Itinerary ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'tasks'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            Checklist & Tasks ({tasks.length})
          </button>
        </div>

        {activeTab === 'tasks' && tasks.length > 0 && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span>Progress:</span>
              <span className="font-bold text-slate-900 dark:text-white">{taskProgress}%</span>
              <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= ACTIVITIES / TIMELINE TAB ================= */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          {loading ? (
            <div className="trip-glass-card rounded-2xl p-10 text-center animate-pulse">
              <p className="text-sm text-slate-500">Loading timeline activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-10 w-10 text-indigo-500" />}
              title="No activities scheduled yet"
              description="Build your trip day-by-day with flight timings, reservations, sightseeing, or boat tours."
              actionLabel="+ Add First Activity"
              onAction={() => setIsAddActivityOpen(true)}
            />
          ) : (
            <div className="space-y-8">
              {groupedActivities.map((group, groupIdx) => (
                <div key={group.dateKey} className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-100/80 dark:bg-slate-800/60 px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
                        {group.dayIndex ? `D${group.dayIndex}` : groupIdx + 1}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mr-2">
                          {group.dayIndex ? `Day ${group.dayIndex}` : `Date`}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {group.dateLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openAddActivityForDate(group.dateKey)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Day
                    </button>
                  </div>

                  {/* Day Activities List */}
                  <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-3.5">
                    {group.items.map((act) => {
                      const duration = calculateDuration(act.startTime, act.endTime);
                      const startTimeStr = new Date(act.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endTimeStr = new Date(act.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={act.id}
                          className="trip-glass-card group relative rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start gap-3.5 flex-1">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-inner">
                                <Clock className="h-5 w-5" />
                              </div>

                              <div className="space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                    {act.title}
                                  </h4>
                                  {duration && (
                                    <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                                      {duration}
                                    </span>
                                  )}
                                </div>

                                {act.description && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl whitespace-pre-wrap">
                                    {act.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {startTimeStr} — {endTimeStr}
                                  </span>
                                  {act.location && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                                        {act.location}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end sm:self-start">
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                                title="Delete activity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TASKS & COMMITMENTS TAB ================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <AIQuickTaskBar tripId={tripId} onTaskCreated={fetchData} />

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTaskFilter('ALL')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  taskFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('OPEN')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  taskFilter === 'OPEN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Pending ({openTasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('COMPLETED')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  taskFilter === 'COMPLETED'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Completed ({completedTasks.length})
              </button>
            </div>

            <Button size="sm" onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Task
            </Button>
          </div>

          {loading ? (
            <div className="trip-glass-card rounded-2xl p-10 text-center animate-pulse">
              <p className="text-sm text-slate-500">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="h-10 w-10 text-indigo-500" />}
              title={
                taskFilter === 'COMPLETED'
                  ? 'No completed tasks yet'
                  : taskFilter === 'OPEN'
                  ? 'All tasks completed!'
                  : 'No tasks created yet'
              }
              description={
                taskFilter === 'COMPLETED'
                  ? 'Tasks you check off will show up here.'
                  : taskFilter === 'OPEN'
                  ? 'Great job! Everything on the to-do list has been finished.'
                  : 'Delegate packing essentials, reservation bookings, or logistics to group members.'
              }
              actionLabel={taskFilter === 'ALL' ? '+ Add First Task' : undefined}
              onAction={taskFilter === 'ALL' ? () => setIsAddTaskOpen(true) : undefined}
            />
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                const assigneeInfo = getAssigneeInfo(task.assignedTo);
                const isOverdue =
                  task.dueDate &&
                  !isDone &&
                  new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

                return (
                  <div
                    key={task.id}
                    className={`trip-glass-card rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 ${
                      isDone ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Checkbox Button */}
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 hover:border-indigo-500 transition group"
                        title={isDone ? 'Mark as pending' : 'Mark as completed'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                          {assigneeInfo && (
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {assigneeInfo.avatar ? (
                                <img
                                  src={assigneeInfo.avatar}
                                  alt=""
                                  className="h-3.5 w-3.5 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-3 w-3 text-indigo-500" />
                              )}
                              {assigneeInfo.name}
                            </span>
                          )}

                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 font-medium ${
                                isOverdue
                                  ? 'text-red-600 dark:text-red-400 font-semibold'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {isOverdue && <AlertCircle className="h-3 w-3" />}
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={isDone ? 'success' : 'secondary'}>
                        {isDone ? 'Done' : 'Pending'}
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ADD ACTIVITY MODAL ================= */}
      <Modal
        isOpen={isAddActivityOpen}
        onClose={() => {
          setIsAddActivityOpen(false);
          resetActivityForm();
        }}
        title="Add Activity to Timeline"
        description="Schedule an event, excursion, flight, or group gathering."
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
            placeholder="e.g. Bring towels, sunscreen, and dry bags. Captain contact: +39 081 123456"
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

      {/* ================= ADD TASK MODAL ================= */}
      <Modal
        isOpen={isAddTaskOpen}
        onClose={() => {
          setIsAddTaskOpen(false);
          resetTaskForm();
        }}
        title="Add Group Task"
        description="Delegate preparation, bookings, or packing responsibilities to members."
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
            label="Due Date (Optional)"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
          />

          {/* Member Assignment Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assign To (Optional)
            </label>
            {trip?.members && trip.members.length > 0 ? (
              <select
                value={taskAssignedTo}
                onChange={(e) => setTaskAssignedTo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Unassigned (Open for anyone)</option>
                {trip.members.map((m) => (
                  <option key={m.id} value={m.user.name || m.user.email}>
                    {m.user.name ? `${m.user.name} (${m.user.email})` : m.user.email}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type="text"
                placeholder="Name or email"
                value={taskAssignedTo}
                onChange={(e) => setTaskAssignedTo(e.target.value)}
                icon={<User className="h-4 w-4 text-slate-400" />}
              />
            )}
          </div>

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
