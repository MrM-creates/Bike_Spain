// A migrated option keeps the exact navigation that was already reviewed for it.
// Coordinates describe the published route target, not a guaranteed private driveway.
function usesReviewedNavigation(stay, option) {
  const ref = stay?.accommodationNavigation;
  if (!ref) return option?.id === 'first' && !option.coordinate && option.name === (stay.currentFirstChoice || stay.firstChoice);
  if (ref.fixed) return Boolean(option);
  return Boolean(option && option.id === ref.optionId && option.name === ref.name &&
    JSON.stringify(option.coordinate || null) === JSON.stringify(ref.coordinate || null) && (option.address || '') === (ref.address || ''));
}
module.exports = {usesReviewedNavigation};
