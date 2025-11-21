import React from 'react';
import { Gift, Calendar as CalendarIcon } from 'lucide-react';

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

const BirthdayItem = ({ user, isToday = false }) => {
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
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-full bg-pink-50 text-pink-500">
          <Gift size={18} />
        </div>
        <div>
          <p className="font-medium text-gray-900">{fullName}</p>
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon size={14} className="mr-1" />
            <span>{formattedDate} • {age} years</span>
          </div>
        </div>
      </div>
      {isToday && (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
          Today!
        </span>
      )}
    </div>
  );
};

const BirthdayCard = ({ users }) => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const { todaysBirthdays, upcomingBirthdays, allUsersWithBirthdays } = React.useMemo(() => {
    const todays = [];
    const upcoming = [];
    const allWithBirthdays = [];
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

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
        console.log('Today\'s birthday:', user.fullName, user.birthday);
        todays.push(user);
      } 
      // Check if birthday is in next 7 days (excluding today)
      else {
        const currentYear = today.getFullYear();
        const birthdayThisYear = new Date(currentYear, userMonth - 1, userDay);
        
        if (birthdayThisYear > today && birthdayThisYear <= next7Days) {
          console.log('Upcoming birthday:', user.fullName, user.birthday);
          upcoming.push(user);
        }
      }
    });
    

    // Sort upcoming birthdays by date
    upcoming.sort((a, b) => {
      const aDate = new Date(today.getFullYear(), parseInt(a.birthday.month) - 1, parseInt(a.birthday.day));
      const bDate = new Date(today.getFullYear(), parseInt(b.birthday.month) - 1, parseInt(b.birthday.day));
      return aDate - bDate;
    });

    return { 
      todaysBirthdays: todays, 
      upcomingBirthdays: upcoming,
      allUsersWithBirthdays: allWithBirthdays
    };
  }, [users, currentMonth, currentDay]);

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
                <BirthdayItem key={user._id} user={user} isToday />
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
                <BirthdayItem key={user._id} user={user} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BirthdayCard;
