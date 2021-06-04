import React from 'react';
import {Provider} from 'mobx-react';

import appStore from './stores/appStore';
import userStore from './stores/user';
// import alarmStore from './stores/alarm';
import App from './app';

const Main = () => {
  // console.log('GOND userStore: ', userStore);
  return (
    <Provider appStore={appStore} userStore={userStore}>
      <App />
    </Provider>
  );
};
// <!-- END CONSTS -->
// ----------------------------------------------------

export default Main;
