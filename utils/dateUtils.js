const getTodayAtMidnight = () => {
  const now = new Date();
  return new Date(now.setHours(0, 0, 0, 0));
};

const getTodayAtEndOfDay = () => {
  const now = new Date();
  return new Date(now.setHours(23, 59, 59, 999));
};

module.exports = {
  getTodayAtMidnight,
  getTodayAtEndOfDay,
};
