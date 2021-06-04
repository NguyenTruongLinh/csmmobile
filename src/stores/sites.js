import {types /*, onSnapshot*/} from 'mobx-state-tree';

const DVRModel = types
  .model({
    kDVR: types.identifierNumber,
    name: types.string,
  })
  .actions(self => ({
    parse(_dvr) {
      self.kDVR = _dvr.KDVR;
      self.name = _dvr.Name;
    },
  }));

const SiteModel = types
  .model({
    key: types.identifierNumber,
    name: types.string,
    childs: types.array(types.reference(DVRModel)),
  })
  .actions(self => ({
    parse(_site) {
      self.key = _site.key;
      self.name = _site.Name;
      self.childs = [];
      Array.isArray(_site.Childs)
        ? _site.Childs.forEach(item => {
            self.childs.push(
              DVRModel.create({
                kDVR: item.KDVR,
                name: item.Name,
              })
            );
          })
        : [];
    },
  }));

export const SitesMapModel = types
  .model({
    sitesList: types.array(types.reference(SiteModel)),
  })
  .actions(self => ({
    parse(data) {
      self.sitesList = [];
      if (Array.isArray(data)) {
        data.forEach(_site => {
          self.push(
            SiteModel.create({
              key: _site.key,
              name: _site.Name,
              childs: Array.isArray(_site.Childs)
                ? _site.Childs.forEach(item => {
                    self.childs.push(
                      DVRModel.create({
                        kDVR: item.KDVR,
                        name: item.Name,
                      })
                    );
                  })
                : [],
            })
          );
        });
      } else {
        __DEV__ &&
          console.log('GOND Load sites list failed, data is not an array');
      }
    },
    edit(_editedSite) {
      let site = self.sitesList.find(item => item.key == _editedSite.Key);
      site.parse(_editedSite);
      self.sitesList.sort(item => item.name);
    },
    delete(_deletedSite) {
      let removedIdx = self.sitesList.findIndex(
        item => item.key == _deletedSite.Key
      );
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
      let site = SiteModel.create({
        key: _newSite.key,
        name: _newSite.Name,
        childs: [],
      }).parse(_newSite);
      self.sitesList.push(site);
      self.sitesList.sort(item => item.name);
    },
  }));

export const sitesStore = SitesMapModel.create({
  sitesList: [],
});

// export default sitesStore;
