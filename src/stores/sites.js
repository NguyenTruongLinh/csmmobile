import { types/*, onSnapshot*/ } from 'mobx-state-tree';

const DVRModel = types.model({
  kDVR: types.identifierNumber,
  name: types.string,
}).actions(self => ({
  load(_dvr) {
    self.kDVR = _dvr.KDVR;
    self.name = _dvr.Name;
  }
}))

const SiteModel = types.model({
  key: types.identifierNumber(0),
  name: types.string(''),
  childs: types.maybeNull(types.array(DVRModel)),
}).actions(self => ({
  load(_site) {
    self.key = _site.key;
    self.name = _site.Name;
    self.childs = [];
    Array.isArray(_site.Childs)
      ? _site.Childs.forEach(item => {
        self.childs.push(DVRModel.create({
          kDVR: item.KDVR,
          name: item.Name,
        }))
      })
      : [];
  }
}));

const sitesStore = types.model({
  sitesList = types.array(SiteModel),
}).actions(self => ({
  load(data) {
    self.sitesList = [];
    if (Array.isArray(data)) {
      data.forEach(_site => {
        self.push(SiteModel.create({
          key: _site.key,
          name: _site.Name,
          childs: Array.isArray(_site.Childs)
            ? _site.Childs.forEach(item => {
              self.childs.push(DVRModel.create({
                kDVR: item.KDVR,
                name: item.Name,
              }))
            })
            : []
        }));
      });
    } else {
      __DEV__ && console.log('GOND Load sites list failed, data is not an array');
    }
  },
  edit(_editedSite) {
    let site = self.sitesList.find(item => item.key == _editedSite.Key);
    site.load(_editedSite);
    self.sitesList.sort(item => item.name);
  },
  delete(_deletedSite) {
    let removedIdx = self.sitesList.findIndex(item => item.key == _deletedSite.Key);
    self.sitesList.splice(removedIdx, 1);
  },
  add(_newSite) {
    // let site = SiteModel.create({
    //   key: _newSite.key,
    //   name: _newSite.Name,
    //   childs: Array.isArray(_newSite.Childs)
    //     ? _newSite.Childs.forEach(item => {
    //       self.childs.push(DVRModel.create({
    //         kDVR: item.KDVR,
    //         name: item.Name,
    //       }))
    //     })
    //     : []
    // });
    let site = SiteModel.create().load(_newSite);
    self.sitesList.push(site);
    self.sitesList.sort(item => item.name);
  },
})).create({
  sitesList: [],
});

export default sitesStore;