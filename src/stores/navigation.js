import {types, onSnapshot, getRoot} from 'mobx-state-tree';
import {AlarmModel} from './alarm';
import {HealthModel} from './health';
import {OAMModel} from './oam';
import {POSModel} from './smarter';
import {SitesMapModel} from './sites';
// import {UserDataModel} from './user';
import {VideoModel} from './video';

const {map, union, safeReference, reference} = types;

const getTypeFromJson = json => {
  const identifier = json.id || json;
  // __DEV__ && console.log('GOND navigationStore getTypeFromJson: ', identifier);
  if (identifier.startsWith('alarm')) return reference(AlarmModel);
  if (identifier.startsWith('health')) return reference(HealthModel);
  if (identifier.startsWith('oam')) return reference(OAMModel);
  if (identifier.startsWith('smarter')) return reference(POSModel);
  if (identifier.startsWith('sites')) return reference(SitesMapModel);
  // if (identifier.startsWith('user')) return reference(UserDataModel);
  if (identifier.startsWith('video')) return reference(VideoModel);
};

export const RouteParam = map(
  union(
    {dispatcher: getTypeFromJson},
    safeReference(AlarmModel),
    safeReference(HealthModel),
    safeReference(OAMModel),
    safeReference(POSModel),
    safeReference(SitesMapModel),
    // safeReference(UserDataModel),
    safeReference(VideoModel)
  )
);

export const RouteParams = types.model('RouteParams', {
  routeKey: types.identifier,
  params: RouteParam,
});

export const NavigationModel = types
  .model('NavigationModel', {
    paramsMap: map(RouteParams),
  })
  .views(self => ({
    getParamsForCurrentRoute(navigation) {
      const {
        state: {key},
      } = navigation;
      let paramsObject = {};
      Array.from(self.paramsMap.get(key).params.entries()).forEach(
        ([key, value]) => {
          paramsObject[key] = value;
        }
      );
      return paramsObject;
    },
  }))
  .actions(self => ({
    setParamsForRoute(params) {
      self.paramsMap.put(params);
    },
    // afterCreate() {
    //   onSnapshot(self, () => {
    //     const rootStore = getRoot(self);
    //     rootStore.save();
    //   });
    // },
  }));

// export const navigationStore = NavigationModel.create({
//   paramsMap: {},
// });
