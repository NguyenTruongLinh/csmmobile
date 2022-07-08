import Toast from 'react-native-root-toast';
import {ActionMessages} from '../localization/texts';
import CMSColors from '../styles/cmscolors';
import {Dimensions} from 'react-native';
import variables from '../styles/variables';

const {width, height} = Dimensions.get('window');
let lastToast = null;
let lastMessage = null;
const showToast = (
  message,
  backgroundColor,
  duration = Toast.durations.LONG
) => {
  // __DEV__ && console.log(`showToast showToast `);
  // if (__DEV__ && message == 'Connecting...')
  //   console.trace('GOND toast connecting ...');
  if (lastToast && lastMessage == message) Toast.hide(lastToast);
  lastToast = Toast.show(message, {
    containerStyle: {
      flex: 1,
      width: width - 30,
      // height: 50,
      justifyContent: 'center',
      // marginBottom: 50,
      marginTop: variables.isPhoneX ? 40 : 0,
    },
    duration: duration,
    position: Toast.positions.TOP, //BOTTOM, //
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
    backgroundColor: backgroundColor,
    opacity: 1,
  });
  lastMessage = message;
};

const toastResult = (message, isError = true) => {
  showToast(message, isError ? CMSColors.Danger : CMSColors.Success);
};

exports.handleSaveResult = (result, errorMessage) => {
  if (result.status == 200 || !result.error) {
    toastResult(ActionMessages.saveSuccess, false);
  } else {
    __DEV__ && console.log('GOND save error: ', result.error);
    toastResult(errorMessage ?? ActionMessages.saveFail, true);
  }
};

exports.handleRequestFailed = error => {
  toastResult(ActionMessages.getDataFailed, true);
};

exports.handleReadLocalDataFailed = error => {
  toastResult(ActionMessages.readLocalFailed, true);
};

exports.handleSaveLocalDataFailed = error => {
  toastResult(ActionMessages.saveLocalFailed, true);
};

exports.onError = message => {
  toastResult(message, true);
};

exports.onWarning = message => {
  showToast(message, CMSColors.Warning);
};

exports.onSuccess = message => {
  toastResult(message ?? ActionMessages.SUCCESS, false);
};

exports.dismiss = () => {
  __DEV__ && console.log('GOND snackbar dismiss!');
  // TODO
};

const onMessage = (msg, backcolor) => {
  // if (__DEV__ && msg == 'Connecting...')
  //   console.trace('GOND toast connecting ...');
  showToast(msg, backcolor ?? CMSColors.Success, Toast.durations.SHORT);
};

exports.dismiss = () => {
  __DEV__ && console.log(`showToast dismiss `);
  // Toast.hide(lastToast);
};

exports.onMessage = onMessage;
exports.onActionMessage = onMessage;
exports.showToast = showToast;
