import {types} from 'mobx-state-tree';

export default ChannelModel = types
  .model({
    channelNo: types.number,
    kDVR: types.number,
    kChannel: types.identifierNumber,
    videoSource: types.number,
    kAudioSource: types.number,
    kPTZ: types.number,
    status: types.maybeNull(types.number),
    name: types.string,
    enable: types.number,
    dwellTime: types.number,
    ap: types.number,
    cameraID: types.number,
    videoCompressQual: types.number,
    videoType: types.maybeNull(types.string), // ?
    kVideo: types.maybeNull(types.string), // ?
    enableiSearch: types.boolean,
    dvrName: types.string,
    fps: types.string,
    resolution: types.maybeNull(types.string), // ?
    modelName: types.string,
    isActive: types.boolean,
    // image: types.maybeNull(types.string),
  })
  .volatile(self => ({
    snapshot: null,
  }))
  .views(self => ({
    // get data() {
    //   const res = getSnapshot(self);
    //   __DEV__ && console.log('GOND channel snapshot = ', res);
    //   return res;
    // },
  }))
  .actions(self => ({
    saveSnapshot(value) {
      self.snapshot = value;
    },
  }));

export const parseChannel = (_channel, activeList = null) => {
  // __DEV__ && console.log('GOND parseChannel ', _channel, activeList);

  return ChannelModel.create({
    channelNo: _channel.ChannelNo,
    kDVR: _channel.KDVR,
    kChannel: _channel.KChannel,
    videoSource: _channel.VideoSource,
    kAudioSource: _channel.KAudioSource,
    kPTZ: _channel.KPTZ,
    status: _channel.Status ?? null,
    name: _channel.Name,
    enable: _channel.Enable,
    dwellTime: _channel.DwellTime,
    ap: _channel.AP,
    cameraID: _channel.CameraID,
    videoCompressQual: _channel.VideoCompressQual,
    videoType: _channel.VideoType,
    kVideo: _channel.KVideo,
    enableiSearch: _channel.EnableiSearch,
    dvrName: _channel.DVRName,
    fps: _channel.FPS,
    resolution: _channel.Resolution,
    modelName: _channel.ModelName,
    isActive:
      activeList && Array.isArray(activeList)
        ? activeList.includes(_channel.ChannelNo)
        : false,
    image: _channel.Image ?? null,
  });
};
