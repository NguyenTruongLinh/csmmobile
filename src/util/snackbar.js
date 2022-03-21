import Toast from 'react-native-root-toast';
import {ActionMessages} from '../localization/texts';
import CMSColors from '../styles/cmscolors';
import {Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

const showToast = (
  message,
  backgroundColor,
  duration = Toast.durations.LONG
) => {
  Toast.show(message, {
    containerStyle: {
      flex: 1,
      width: width - 30,
      height: 50,
      justifyContent: 'center',
      // marginBottom: 50,
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
};

const toastResult = (message, isError = true) => {
  showToast(message, isError ? CMSColors.Danger : CMSColors.Success);
};

exports.handleSaveResult = (result, errorMessage) => {
  if (result.status == 200 || !result.error) {
    toastResult(ActionMessages.saveSuccess, false);
  } else {
    __DEV__ && console.log('GOND save error: ', result.error);
    toastResult(errorMessage || ActionMessages.saveFail, true);
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

exports.onSuccess = message => {
  toastResult(message ?? ActionMessages.SUCCESS, false);
};

const onMessage = (msg, backcolor) => {
  showToast(msg, backcolor ?? CMSColors.Success);
};

exports.onMessage = onMessage;
exports.onActionMessage = onMessage;
exports.showToast = showToast;
