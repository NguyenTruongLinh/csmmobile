import {types} from 'mobx-state-tree';

export default ChannelModel = types
  .model({
    channelNo: types.identifierNumber, // types.number,
    kDVR: types.number,
    kChannel: types.number, // types.identifierNumber,
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
    canLive: types.optional(types.boolean, true),
    canSearch: types.optional(types.boolean, true),
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
    canPlayMode(isLive) {
      return isLive ? self.canLive : self.canSearch;
    },
  }))
  .actions(self => ({
    saveSnapshot(value) {
      self.snapshot = value;
    },
    setLiveSearchPermission(canLive, canSearch) {
      self.canLive = canLive;
      self.canSearch = canSearch;
    },
    update(data) {
      if (self.channelNo != data.channelNo) return;
      // if (self.kChannel != data.kChannel || self.name != data.name) {
      self.kDVR = data.kDVR;
      self.kChannel = data.kChannel;
      self.videoSource = data.videoSource;
      self.kAudioSource = data.kAudioSource;
      self.kPTZ = data.kPTZ;
      self.status = data.status;
      self.name = data.name;
      self.enable = data.enable;
      self.dwellTime = data.dwellTime;
      self.ap = data.ap;
      self.cameraID = data.cameraID;
      self.videoCompressQual = data.videoCompressQual;
      self.videoType = data.videoType;
      self.kVideo = data.kVideo;
      self.enableiSearch = data.enableiSearch;
      self.dvrName = data.dvrName;
      self.fps = data.fps;
      self.resolution = data.resolution;
      self.modelName = data.modelName;
      self.isActive = data.isActive;
      // }
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
