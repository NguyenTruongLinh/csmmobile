import { types } from 'mobx-state-tree';

export const SignalingClientType = types.custom({
  name: 'SignalingClient',
  fromSnapshot(value) {
    return JSON.parse(value);
  },
  toSnapshot(value) {
    return value.toString();
  },
  isTargetType(value) {
    return typeof value === 'object';
  },
  getValidationMessage(value) {
    return typeof value === 'object' ? '' : `${value} does not look like a valid object`;
  }
})

export const PeerConnectionType = types.custom({
  name: 'PeerConnection',
  fromSnapshot(value) {
    return JSON.parse(value);
  },
  toSnapshot(value) {
    return value.toString();
  },
  isTargetType(value) {
    return typeof value === 'object';
  },
  getValidationMessage(value) {
    return typeof value === 'object' ? '' : `${value} does not look like a valid object`;
  }
})

export const DataChannelType = types.custom({
  name: 'DataChannel',
  fromSnapshot(value) {
    return JSON.parse(value);
  },
  toSnapshot(value) {
    return value.toString();
  },
  isTargetType(value) {
    return typeof value === 'object';
  },
  getValidationMessage(value) {
    return typeof value === 'object' ? '' : `${value} does not look like a valid object`;
  }
})