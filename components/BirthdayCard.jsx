import React from 'react';
import { Gift, Calendar as CalendarIcon, Eye } from 'lucide-react';

const monthNameToNumber = (monthName) => {
  if (!monthName) return null;
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  if (typeof monthName === 'number') return monthName;
  const monthStr = String(monthName).toLowerCase();
  const monthIndex = months.findIndex(m => 
    monthStr.startsWith(m.substring(0, 3))
  );
  return monthIndex !== -1 ? monthIndex + 1 : null;
};

const BirthdayItem = ({ user, isToday = false, onViewUser }) => {
  const { fullName, birthday } = user;
  const age = birthday.year ? new Date().getFullYear() - parseInt(birthday.year) : 'N/A';
  
  let formattedDate;
  try {
    const monthNum = birthday.month && !isNaN(birthday.month) 
      ? birthday.month.padStart(2, '0')
      : monthNameToNumber(birthday.month)?.toString().padStart(2, '0') || '01';
      
    const day = birthday.day.padStart(2, '0');
    const year = birthday.year || new Date().getFullYear();
    
    const birthdayDate = new Date(`${year}-${monthNum}-${day}`);
    formattedDate = birthdayDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    // Error formatting date
    formattedDate = 'Invalid date';
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center space-x-3 flex-1">
        <div className="p-2 rounded-full bg-pink-50 text-pink-500">
          <Gift size={18} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{fullName}</p>
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon size={14} className="mr-1" />
            <span>{formattedDate} • {age} years</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {isToday && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
            Today!
          </span>
        )}
        <button
          onClick={() => onViewUser(user._id)}
          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
          title="View User Details"
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
};

const BirthdayCard = ({ users, onViewUser }) => {
  // Get current date in Michigan timezone (America/Detroit)
  const getMichiganDate = () => {
    const now = new Date();
    const michiganDateStr = now.toLocaleString('en-US', {
      timeZone: 'America/Detroit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const [datePart] = michiganDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    
    return {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      fullDate: new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    };
  };

  const michiganToday = getMichiganDate();
  const currentMonth = michiganToday.month;
  const currentDay = michiganToday.day;

  const { todaysBirthdays, upcomingBirthdays, allUsersWithBirthdays } = React.useMemo(() => {
    const todays = [];
    const upcoming = [];
    const allWithBirthdays = [];
    const next7Days = new Date(michiganToday.fullDate);
    next7Days.setDate(michiganToday.fullDate.getDate() + 7);

    users.forEach(user => {
      if (!user.birthday?.month || !user.birthday?.day) {
        return;
      }
      
      // Handle both numeric and text month formats
      let userMonth = parseInt(user.birthday.month);
      if (isNaN(userMonth)) {
        userMonth = monthNameToNumber(user.birthday.month);
        if (userMonth === null) {
          return;
        }
      }
      
      const userDay = parseInt(user.birthday.day);
      
      if (isNaN(userDay)) {
        return;
      }

      allWithBirthdays.push({
        ...user,
        formattedBirthday: `${user.birthday.month.padStart(2, '0')}-${user.birthday.day.padStart(2, '0')}`
      });
      
      // Check if birthday is today
      if (userMonth === currentMonth && userDay === currentDay) {
        todays.push(user);
      } 
      // Check if birthday is in next 7 days (excluding today)
      else {
        const currentYear = michiganToday.year;
        const birthdayThisYear = new Date(currentYear, userMonth - 1, userDay);
        
        if (birthdayThisYear > michiganToday.fullDate && birthdayThisYear <= next7Days) {
          upcoming.push(user);
        }
      }
    });
    

    // Sort upcoming birthdays by date
    upcoming.sort((a, b) => {
      const aDate = new Date(michiganToday.year, parseInt(a.birthday.month) - 1, parseInt(a.birthday.day));
      const bDate = new Date(michiganToday.year, parseInt(b.birthday.month) - 1, parseInt(b.birthday.day));
      return aDate - bDate;
    });

    return { 
      todaysBirthdays: todays, 
      upcomingBirthdays: upcoming,
      allUsersWithBirthdays: allWithBirthdays
    };
  }, [users, currentMonth, currentDay, michiganToday.year, michiganToday.fullDate]);

  const totalBirthdays = todaysBirthdays.length + upcomingBirthdays.length;

  if (totalBirthdays === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <Gift className="mr-2 text-pink-500" size={20} />
          Birthdays
        </h3>
        <p className="text-gray-500 text-sm">
          No birthdays today or in the next 7 days.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Gift className="mr-2 text-pink-500" size={20} />
          {todaysBirthdays.length > 0 ? "Today's Birthdays" : "Upcoming Birthdays"}
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {todaysBirthdays.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">🎉 Celebrating Today</h4>
            <div className="space-y-2">
              {todaysBirthdays.map(user => (
                <BirthdayItem key={user._id} user={user} isToday onViewUser={onViewUser} />
              ))}
            </div>
          </div>
        )}
        
        {upcomingBirthdays.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              🗓️ Upcoming in Next 7 Days
            </h4>
            <div className="space-y-2">
              {upcomingBirthdays.map(user => (
                <BirthdayItem key={user._id} user={user} onViewUser={onViewUser} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BirthdayCard;
