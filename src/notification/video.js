import {NOTIFY_ACTION} from '../consts/misc';
// import {CLOUD_TYPE, VSCCommandString} from '../consts/video';

export function onVideoNotifEvent({videoStore, action, content, cmd}) {
  if (!videoStore) return;
  __DEV__ && console.log('GOND onVideoNotifEvent ', action, content);
  switch (action) {
    case NOTIFY_ACTION.STREAM_CREATED:
      videoStore && videoStore.onReceiveStreamInfo(content, cmd);
      // } else {
      //   __DEV__ &&
      //     console.log(
      //       `GOND Invalid notification (cloudtype ${
      //         videoStore.cloudType == CLOUD_TYPE.HLS
      //       }): `,
      //       content
      //     );
      // }
      break;
    case NOTIFY_ACTION.STREAM_NEW:
      // videoStore.onReceiveHLSStream(content);
      videoStore && videoStore.onReceiveStreamInfo(content, cmd);
      break;
  }
}
