import { types } from 'mobx-state-tree';

const appStore = types.model({
  nextScene: types.string,
  nextLogId: types.string,
  rotatable: types.boolean,
  // domains: types.array(types.string),
  domain: types.string,
  deviceid: types.string,
}).actions(self => ({

})).create({
  nextScene: '',
  nextLogId: '',
  rotatable: true,
  domain: '',
  deviceid: '',
});

export default appStore;