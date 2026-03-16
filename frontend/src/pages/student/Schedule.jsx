import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
  BellAlertIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const StudentSchedule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const [currentWeek, setCurrentWeek] = useState(0);
  const [stats, setStats] = useState({
    totalClasses: 0,
    completedToday: 0,
    upcomingToday: 0,
    weeklyHours: 0
  });

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Time slots (8 AM to 5 PM)
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    fetchSchedule();
  }, [currentWeek]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/schedule/student');

      console.log('Schedule response:', response.data);

      // Process schedule
      let scheduleData = [];
      if (Array.isArray(response.data)) {
        scheduleData = response.data;
      } else if (response.data?.schedule && Array.isArray(response.data.schedule)) {
        scheduleData = response.data.schedule;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        scheduleData = response.data.data;
      }
      
      setSchedule(scheduleData);

      // Calculate stats
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayClasses = scheduleData.filter(cls => cls?.day === today);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const completedToday = todayClasses.filter(cls => {
        if (!cls?.endTime) return false;
        const [endHour, endMinute] = cls.endTime.split(':').map(Number);
        return currentHour > endHour || (currentHour === endHour && currentMinute > endMinute);
      }).length;

      const upcomingToday = todayClasses.filter(cls => {
        if (!cls?.startTime) return false;
        const [startHour, startMinute] = cls.startTime.split(':').map(Number);
        return currentHour < startHour || (currentHour === startHour && currentMinute < startMinute);
      }).length;

      // Calculate weekly hours
      const weeklyHours = scheduleData.reduce((acc, cls) => {
        if (!cls?.startTime || !cls?.endTime) return acc;
        const [startHour] = cls.startTime.split(':').map(Number);
        const [endHour] = cls.endTime.split(':').map(Number);
        return acc + (endHour - startHour);
      }, 0);

      setStats({
        totalClasses: scheduleData.length,
        completedToday,
        upcomingToday,
        weeklyHours
      });

    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
    toast.success('Schedule refreshed');
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => prev + 1);
  };

  const handleToday = () => {
    setCurrentWeek(0);
    setSelectedDay(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  };

  const getClassesForDay = (day) => {
    return schedule
      .filter(cls => cls?.day === day)
      .sort((a, b) => (a?.startTime || '').localeCompare(b?.startTime || ''));
  };

  const getCurrentTimeIndicator = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    const startOfDay = 8 * 60; // 8:00 AM
    const endOfDay = 17 * 60; // 5:00 PM
    
    if (totalMinutes < startOfDay || totalMinutes > endOfDay) return null;
    
    return ((totalMinutes - startOfDay) / (endOfDay - startOfDay)) * 100;
  };

  const currentTimePosition = getCurrentTimeIndicator();

  const getClassStatus = (classItem) => {
    if (!classItem?.startTime || !classItem?.endTime) return 'upcoming';
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [startHour, startMinute] = classItem.startTime.split(':').map(Number);
    const [endHour, endMinute] = classItem.endTime.split(':').map(Number);

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    const currentTotal = currentHour * 60 + currentMinute;

    if (currentTotal < startTotal) return 'upcoming';
    if (currentTotal > endTotal) return 'completed';
    return 'ongoing';
  };

  const showClassDetails = (cls) => {
    const subjectName = cls.subject?.name || cls.subject || 'Unknown Subject';
    const teacherName = cls.teacher?.name || cls.teacher || 'TBA';
    
    toast.custom(
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700 max-w-sm">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{subjectName}</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="font-medium">Teacher:</span> {teacherName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="font-medium">Room:</span> {cls.room || 'TBA'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="font-medium">Time:</span> {cls.startTime} - {cls.endTime}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="font-medium">Day:</span> {cls.day}
          </p>
          {cls.subject?.credits && (
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="font-medium">Credits:</span> {cls.subject.credits}
            </p>
          )}
        </div>
      </div>,
      {
        duration: 4000,
        position: 'top-center',
      }
    );
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Schedule</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.name} • Semester {user?.semester} • {user?.department?.name || 'No Department'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClasses}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Classes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <AcademicCapIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingToday}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.weeklyHours}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentWeek === 0 ? 'This Week' : currentWeek > 0 ? `Week ${currentWeek + 1}` : `Week ${Math.abs(currentWeek)}`}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(new Date().setDate(new Date().getDate() + currentWeek * 7)).toLocaleDateString()} - 
              {new Date(new Date().setDate(new Date().getDate() + currentWeek * 7 + 6)).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {currentWeek !== 0 && (
          <div className="text-center mt-2">
            <button
              onClick={handleToday}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              Back to Today
            </button>
          </div>
        )}
      </div>

      {/* Day Selector */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map(day => {
            const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && currentWeek === 0;
            const classesForDay = getClassesForDay(day);
            
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 min-w-[120px] p-3 rounded-lg border transition-colors ${
                  selectedDay === day
                    ? 'bg-primary-600 dark:bg-primary-500 text-white border-primary-600 dark:border-primary-500'
                    : isToday
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className="text-sm font-medium">{day}</div>
                <div className={`text-xs mt-1 ${
                  selectedDay === day ? 'text-primary-100 dark:text-primary-200' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {classesForDay.length} class{classesForDay.length !== 1 ? 'es' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[100px_repeat(6,1fr)] bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Time</div>
          {daysOfWeek.map(day => (
            <div
              key={day}
              className={`p-3 text-sm font-medium text-center ${
                selectedDay === day 
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="relative">
          {timeSlots.map((time, index) => (
            <div key={time} className="grid grid-cols-[100px_repeat(6,1fr)] border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              {/* Time Label */}
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {time}
              </div>

              {/* Day Columns */}
              {daysOfWeek.map(day => {
                const classesAtTime = schedule.filter(
                  cls => cls?.day === day && cls?.startTime === time
                );

                return (
                  <div key={`${day}-${time}`} className="p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[80px]">
                    {classesAtTime.map((cls, idx) => {
                      const status = getClassStatus(cls);
                      const statusColors = {
                        ongoing: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-400',
                        upcoming: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400',
                        completed: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      };

                      const subjectName = cls.subject?.name || cls.subject || 'Unknown Subject';
                      const teacherName = cls.teacher?.name || cls.teacher || 'TBA';

                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border ${statusColors[status]} cursor-pointer hover:shadow-md dark:hover:shadow-gray-800 transition-shadow mb-1`}
                          onClick={() => showClassDetails(cls)}
                        >
                          <p className="font-medium text-sm truncate">{subjectName}</p>
                          <p className="text-xs mt-1 flex items-center gap-1">
                            <UserIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{teacherName}</span>
                          </p>
                          <p className="text-xs mt-1 flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{cls.room || 'TBA'}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Current Time Indicator */}
          {currentTimePosition !== null && currentWeek === 0 && (
            <div
              className="absolute left-[100px] right-0 pointer-events-none"
              style={{ top: `${currentTimePosition}%` }}
            >
              <div className="relative">
                <div className="absolute left-0 right-0 border-t-2 border-red-500 dark:border-red-400"></div>
                <div className="absolute -left-1 -top-2 w-4 h-4 bg-red-500 dark:bg-red-400 rounded-full"></div>
                <span className="absolute left-4 -top-3 text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                  Now
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Day Schedule Summary */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-primary-400 mb-4">
          {selectedDay}'s Schedule
        </h2>
        
        <div className="space-y-3">
          {getClassesForDay(selectedDay).length > 0 ? (
            getClassesForDay(selectedDay).map((cls, index) => {
              const status = getClassStatus(cls);
              const statusText = {
                ongoing: '🟢 Ongoing',
                upcoming: '🟡 Upcoming',
                completed: '✅ Completed'
              };

              const statusColors = {
                ongoing: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
                upcoming: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
                completed: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
              };

              const subjectName = cls.subject?.name || cls.subject || 'Unknown Subject';
              const teacherName = cls.teacher?.name || cls.teacher || 'TBA';

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      status === 'ongoing' ? 'bg-green-100 dark:bg-green-900/30' :
                      status === 'upcoming' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <ClockIcon className={`h-6 w-6 ${
                        status === 'ongoing' ? 'text-green-600 dark:text-green-400' :
                        status === 'upcoming' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{subjectName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{teacherName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{cls.startTime} - {cls.endTime}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Room {cls.room || 'TBA'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
                      {statusText[status]}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300">No classes scheduled for {selectedDay}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Enjoy your day off!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <BellAlertIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">Schedule Tips</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Green cards show ongoing classes</li>
              <li>Yellow cards are upcoming classes</li>
              <li>Gray cards are completed classes</li>
              <li>The red line shows the current time</li>
              <li>Click on any class to see more details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSchedule;