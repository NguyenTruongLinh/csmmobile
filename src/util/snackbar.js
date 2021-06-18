import Snackbar from 'react-native-snackbar';
import {ActionMessages} from '../localization/texts';
import CMSColors from '../styles/cmscolors';

const showMessage = (message, isError = true) => {
  Snackbar.show({
    text: message,
    duration: Snackbar.LENGTH_LONG,
    backgroundColor: isError ? CMSColors.Danger : CMSColors.Success,
  });
};

exports.handleSaveResult = (result, errorMessage) => {
  if (result.error) {
    __DEV__ && console.log('GOND save error: ', result.error);
    showMessage(errorMessage || ActionMessages.saveFail, true);
  } else {
    showMessage(ActionMessages.saveSuccess, false);
  }
};

exports.handleGetDataFailed = error => {
  showMessage(ActionMessages.getDataFailed, true);
};

exports.handleReadLocalDataFailed = error => {
  showMessage(ActionMessages.readLocalFailed, true);
};

exports.handleSaveLocalDataFailed = error => {
  showMessage(ActionMessages.saveLocalFailed, true);
};

exports.onMessage = (msg, backcolor, actions) => {
  if (!actions) {
    Snackbar.show({
      text: msg,
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: backcolor, //CMSColors.Danger,
      // onTimeOut: this.onSnackbarTimeout,
    });
  } else {
    let {title, color, onPress} = actions;
    Snackbar.show({
      text: msg,
      duration: Snackbar.LENGTH_INDEFINITE,
      backgroundColor: backcolor,
      // onTimeOut: this.onSnackbarTimeout,
      action: {
        title: title,
        color: color,
        onPress: onPress,
      },
    });
  }
};
