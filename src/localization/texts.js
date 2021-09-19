export const Intro = {
  skip: 'SKIP',
  next: 'NEXT',
  back: 'BACK',
  // intro titles and descriptions...
};

export const Welcome = {
  title: 'SIGN IN TO GET THE MOST OUT OF YOUR',
  titleBold: 'SMART VIDEO SYSTEM.',
  description:
    'By signing up for your i3 cloud account you will be able to unlock multiple features like real-time alarms, POS integration, video streaming, health monitoring, and much more. ',
  contactLink: 'Contact i3 to sign up today.',
  login: 'LOGIN',
  skip: 'Stand alone remote app',
};

export const Login = {
  title: 'Welcome to ',
  titleBold: 'i3 CMS MOBILE',
  description: 'Please Sign in to continue',
  domain: 'Domain',
  username: 'Username',
  password: 'Password',
  login: 'LOGIN',
  skip: 'FORGOT PASSWORD?',
  errorTitle: 'Login Error',
  errorLoginIncorrect: 'Incorrect username or password.',
  errorLoginCantConnect: 'Cannot connect to server.',
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
  videoDirecDesc:
    'Connect to your NVR directly. Public IP is required, mobile connection must be opened.',
  videoStreamDesc:
    'Connect to your NVR via cloud. Subject to AWS fees and data caps.',
};

export const ActionMessages = {
  actionFailed: 'Operation failed! Please try again later',
  saveSuccess: 'Save successfully!',
  saveFail: 'Cannot save, please try again later!',
  saveFailRestart: 'Cannot save, please restart app and try again!',
  getDataFailed: 'Cannot connect to CMS server, please try again later!',
  readLocalFailed: 'Cannot read local data!',
  saveLocalFailed: 'Cannot save local data!',
};

export const Comps = {
  searchPlaceholder: 'Search',
  notePlaceholder: 'Please click here to add notes',
  alarmFilterTitle: 'Alarm search',
  searchButton: 'Search',
  cancelButton: 'Cancel',
};

export const Video = {
  live: 'Live',
  search: 'Search',
  noVideo: 'No video',
  channelError: 'Channel not found!',
  authenTitle: 'NVR Authorization',
};

export const STREAM_STATUS = {
  DONE: '',
  WAITING: 'Waiting for connection...',
  CONNECTING: 'Connecting...',
  RECONNECTING: 'Reconnecting...',
  CONNECTED: 'Connected.',
  BUFFERING: 'Buffering...',
  ERROR: 'Network Error.',
  TIMEOUT: 'Time out.',
  NOVIDEO: 'No video.',
  DISCONNECTED: 'Disconnected.',
};

export const Alarm = {
  eventTime: 'Event time',
  process: 'Process',
};
