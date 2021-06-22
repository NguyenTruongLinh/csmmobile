import React from 'react';
import {Provider} from 'mobx-react';
import {ModalPortal} from 'react-native-modals';

import appStore from './stores/appStore';
import userStore from './stores/user';
import videoStore from './stores/video';
import alarmStore from './stores/alarm';
import posStore from './stores/pos';
// import oamStore from './stores/oam';
import sitesStore from './stores/sites';
// import healthStore from './stores/health';
import App from './app';

const Main = () => {
  // console.log('GOND userStore: ', userStore);
  return (
    <Provider
      appStore={appStore}
      userStore={userStore}
      sitesStore={sitesStore}
      videoStore={videoStore}
      alarmStore={alarmStore}
      posStore={posStore}
      // healthStore={healthStore}
      // oamStore={oamStore}
    >
      <App />
      <ModalPortal />
    </Provider>
  );
};
// <!-- END CONSTS -->
// ----------------------------------------------------

export default Main;
