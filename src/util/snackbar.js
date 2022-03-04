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
  if (result.status == 200 || !result.error) {
    showMessage(ActionMessages.saveSuccess, false);
  } else {
    __DEV__ && console.log('GOND save error: ', result.error);
    showMessage(errorMessage || ActionMessages.saveFail, true);
  }
};

exports.handleRequestFailed = error => {
  showMessage(ActionMessages.getDataFailed, true);
};

exports.handleReadLocalDataFailed = error => {
  showMessage(ActionMessages.readLocalFailed, true);
};

exports.handleSaveLocalDataFailed = error => {
  showMessage(ActionMessages.saveLocalFailed, true);
};

exports.onError = message => {
  showMessage(message, true);
};

exports.onSuccess = message => {
  showMessage(message ?? ActionMessages.SUCCESS, false);
};

exports.dismiss = () => {
  Snackbar.dismiss();
};

const onMessage = (msg, backcolor, actions) => {
  if (!actions) {
    Snackbar.show({
      text: msg,
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: backcolor ?? CMSColors.Success,
      // onTimeOut: this.onSnackbarTimeout,
    });
  } else {
    // let {title, color, onPress} = actions;
    Snackbar.show({
      text: msg,
      duration: Snackbar.LENGTH_INDEFINITE,
      backgroundColor: backcolor ?? CMSColors.Success,
      // onTimeOut: this.onSnackbarTimeout,
      action: actions,
    });
  }
};

exports.onMessage = onMessage;
exports.onActionMessage = onMessage;
