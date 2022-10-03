export const Intro = {
  skip: 'SKIP',
  next: 'NEXT',
  back: 'BACK',
  // intro titles and descriptions...
};

export const Welcome = {
  title: 'SIGN IN TO GET THE MOST OUT OF YOUR',
  titleBold: 'INTELLIGENT VIDEO SYSTEM.',
  description:
    'By signing up for your i3 cloud account you will be able to unlock multiple features like real-time alarms, POS integration, video streaming, health monitoring, and much more. ',
  contactLink: 'Contact i3 to sign up today.',
  login: 'LOGIN',
  skip: 'Stand alone remote app',
};

export const Login = {
  title: 'Welcome to ',
  titleBold: 'i3 CMS APP',
  description: 'Please Sign in to continue',
  domain: 'Domain',
  username: 'Username*',
  password: 'Password*',
  login: 'LOGIN',
  skip: 'FORGOT PASSWORD?',
  errorTitle: 'Login Error',
  errorLoginIncorrect: 'Incorrect username or password.',
  errorExpiredAccount: 'This account is expired',
  loginSuccess: 'Login successfully',
  errorLoginCantConnect: 'Cannot connect to server.',
  emailOrUsernameIncorrect: 'The email or username is incorrect.',
  accountLocked:
    'Account is disabled for %s due to reaching the maximum failed login attempts',
  phoneContactTitle: 'Contact i3 tech via phone: ',
  phoneContactNumber: '1.866.840.0004',
  changePasswordTitte: 'Change password',
  changePassworDescription:
    'Your password has expired and you need to change it before you sign in to CMS.',
  oldPassword: 'Old password*',
  newPassword: 'New password*',
  confirmPassword: 'Confirm new password*',
  newPasswordError: 'Password must contain at least 10 characters',
  confirmPasswordError: 'Password does not match!',
  passwordChangeErrorTitle: 'Password change failed',
  passwordChangedSuccess: 'Password changed successfully',
  userPassswordExisted:
    'New password has been used for the last %d times. Please choose another password.',
  forgotPassword: 'FORGOT PASSWORD?',
  forgotPasswordTitle: 'Forgot Password',
  submitedForgotPassword:
    'An email include your password was sent to your email, please go to your mailbox to get the password.',
  forgotPasswordErrorTitle: 'Submit forgot password failed',
  email: 'Email *',
  username: 'Username *',
  copyRight:
    '© 2022 i3 International Inc. The i3 logos are property of i3 International Inc & i3 America Nevada Inc. All rights reserved.',
};

export const Tabbar = {
  home: 'Home',
  video: 'Video',
  alarm: 'Alarm',
  settings: 'Settings',
};

export const Settings = {
  logOut: 'Logout',
  save: 'SAVE',
  profileTitle: 'EDIT PROFILE',
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  videoDirectName: 'Direct connection',
  videoStreamName: 'Video streaming',
  videoRelayServer: 'Relay server',
  videoDirecDesc:
    'Connect to your NVR directly. Public IP is required, mobile connection must be opened.',
  videoStreamDesc:
    'Connect to your NVR via cloud. Subject to AWS fees and data caps.',
  videoRelayDesc:
    "Connect to your NVR via i3's relay server. Subject to Relay Server fees and data caps.",
};

export const ActionMessages = {
  actionFailed: 'Operation failed! Please try again later',
  saveSuccess: 'Save successfully!',
  saveFail: 'Cannot save, please try again later!',
  saveFailRestart: 'Cannot save, please restart app and try again!',
  getDataFailed: 'Cannot connect to CMS server, please try again later!',
  readLocalFailed: 'Cannot read local data!',
  saveLocalFailed: 'Cannot save local data!',
  SUCCESS: 'Success!',
};

export const Comps = {
  searchPlaceholder: 'Search',
  notePlaceholder: 'Please click here to add notes',
  alarmFilterTitle: 'Alarm search',
  searchButton: 'Search',
  cancelButton: 'Cancel',
  applyButton: 'Apply',
};

export const VIDEO = {
  LIVE: 'Live',
  SEARCH: 'Search',
  NO_VIDEO: 'No video',
  CHANNEL_ERROR: 'Channel not found!',
  AUTHEN_TITLE: 'NVR Authorization',
  SELECT_CHANNEL_1: 'Please press ',
  SELECT_CHANNEL_2: ' to select channels',
  NO_VSC_PERMISSION: "You don't have VSC permission",
  NO_VIDEO_COME: 'No incoming video',
  CANNOT_CONNECT: 'Cannot connect to NVR',
  WRONG_CLOUD_TYPE: 'Cloud type config is incorrect, please contact support.',
  SNAPSHOT_TAKEN: 'The snapshot has been moved to photo folder.',
  NO_NVR_PERMISSION: "You don't have permission",
  WRONG_RELAY_SERVER_INFO:
    'Relay server info is incorrect, please contact support.',
};

export const STREAM_STATUS = {
  DONE: '',
  WAITING: 'Waiting for connection...',
  CONNECTING: 'Connecting...',
  RECONNECTING: 'Reconnecting...',
  CONNECTED: 'Connected.',
  LOGING_IN: 'Logging in...',
  LOGIN_FAILED: 'Login failed',
  BUFFERING: 'Buffering...',
  SOURCE_ERROR: 'Video source error.',
  ERROR: 'Network Error.',
  SERVER_REJECT: 'Server reject accepted',
  TIMEOUT: 'Time out.',
  NOVIDEO: 'No video.',
  DISCONNECTED: 'Disconnected.',
  NO_PERMISSION: "You don't have permission.",
  DISABLED: 'Channel disabled.',
  CHANGED: 'Server info changed.',
  WRONG_SERVER: 'Wrong server id.',
  PORT_ERROR: 'Video port error.',
  CONNECTION_ERROR: 'Connection Failed.',
  RELAY_HANDSHAKE_FAILED: 'Network Error.', //'Relay handshake failed.',
  RELAY_REMOTE_CONFIG_CHANGED: 'Network Error.', // 'Remote relay config changed, try reconnecting...',
};

export const ALARM = {
  EVENT_TIME: 'Event time',
  PROCESSED_BY: 'Processed by',
  NONEMPLOYEE: 'Non-employee',
};

export const HEALTH = {
  HISTORICAL: 'Historical',
  DISMISS_ALL: 'Dismiss all alerts',
  DISMISS_CURRENT: 'Dismiss',
  NOTIF_ALERT_SETTINGS: 'Alert Settings.',
  NOTIF_ALERT_SETTINGS_CONTENT: 'Alert Settings has changed.',
  NOTIF_HEALTHL: 'CMS Health.',
  ALERT_DISMISSED: 'Alert dismissed.',
};

export const SMARTER = {
  SHOW_CHART: 'SHOW CHART',
  SHOW_DATA: 'SHOW DATA',
  SORT_MODAL_TITLE: 'Risk factor type',
  TOTAL_RISK: 'Total risk factor',
  ORDER_TIME: 'Order time',
  CASHIER: 'Cashier',
  REG: 'Reg #',
  SUB_TOTAL: 'Sub total',
  TAX: 'Tax',
  TOTAL: 'Total',
  FLAG_WEIGHT: 'Flag weight',
  FLAG: 'Flag',
  PAYMENT: 'Payment',
  CHANGE: 'Change',
  FILTER_MODAL_TITLE: 'Search conditions',
  TRANSACTION: 'Transaction',
  DOWNLOAD: 'Download',
  SHARE_MESSAGE: 'Download Video Exception',
  SHARE_SUBJECT: 'Video Exception',
  NOTIFY_TITLE: 'POS Exception',
};

export const COMMON = {
  CMS_APP: 'CMS App',
  NO_DATA: 'There is no data',
  FROM: 'From',
  TO: 'To',
  RETRY: 'RECONNECT',
};
