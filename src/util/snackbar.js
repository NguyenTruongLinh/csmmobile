import Snackbar from 'react-native-snackbar';
import {ActionMessages} from '../localization/texts';
import CMSColors from '../styles/cmscolors';

handleSaveResult = (result, errorMessage) => {
  if (result.error) {
    __DEV__ && console.log('GOND save error: ', result.error);
    Snackbar.show({
      text: errorMessage || ActionMessages.saveFail,
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: CMSColors.Danger,
    });
  } else {
    Snackbar.show({
      text: ActionMessages.saveSuccess,
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: CMSColors.Success,
    });
  }
};

handleGetDataFailed = error => {
  Snackbar.show({
    text: ActionMessages.getDataFailed,
    duration: Snackbar.LENGTH_LONG,
    backgroundColor: CMSColors.Danger,
  });
};

handleReadLocalDataFailed = error => {
  Snackbar.show({
    text: ActionMessages.readLocalFailed,
    duration: Snackbar.LENGTH_LONG,
    backgroundColor: CMSColors.Danger,
  });
};

handleSaveLocalDataFailed = error => {
  Snackbar.show({
    text: ActionMessages.saveLocalFailed,
    duration: Snackbar.LENGTH_LONG,
    backgroundColor: CMSColors.Danger,
  });
};

module.exports = {
  handleSaveResult,
  handleGetDataFailed,
  handleReadLocalDataFailed,
  handleSaveLocalDataFailed,
};
