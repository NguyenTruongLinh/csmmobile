exports.numberValue = value => {
  try {
    return typeof value == 'number' ? value : parseInt(value);
  } catch (ex) {
    __DEV__ && console.log('GOND ', ex, ': ', value);
    return 0;
  }
};
