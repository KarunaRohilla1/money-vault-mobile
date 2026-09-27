export function registrationError(values: {
  confirmPin: string;
  displayName: string;
  pin: string;
  username: string;
}) {
  const username = values.username.trim();
  const displayName = values.displayName.trim();

  if (!username) {
    return "Username is required.";
  }

  if (!/^[a-zA-Z0-9_]{3,32}$/u.test(username)) {
    return "Username must be 3 to 32 letters, numbers, or underscores.";
  }

  if (!displayName) {
    return "Display name is required.";
  }

  if (displayName.toLowerCase() === username.toLowerCase()) {
    return "Display name must be different from your username.";
  }

  if (values.pin.length < 4 || values.pin.length > 6) {
    return "PIN must be between 4 and 6 characters.";
  }

  if (values.pin !== values.confirmPin) {
    return "PIN and confirmation do not match.";
  }

  return null;
}
