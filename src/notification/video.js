import {NOTIFY_ACTION} from '../consts/misc';

export function onVideoNotifEvent(videoStore, action, content) {
  __DEV__ && console.log('GOND onVideoNotifEvent ', action, content);
  switch (action) {
    case NOTIFY_ACTION.STREAM_CREATED:
      videoStore.onReceiveStreamInfo(content);
  }
}
