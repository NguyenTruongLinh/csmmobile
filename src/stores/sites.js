import {types, flow, applySnapshot} from 'mobx-state-tree';

import apiService from '../services/api';
import utils from '../util/general';
import snackbarUtil from '../util/snackbar';
import {Route, Site as SiteRoute} from '../consts/apiRoutes';
// import {Login as LoginTxt} from '../localization/texts';

export const DVRModel = types
  .model({
    kDVR: types.identifierNumber,
    name: types.string,
  })
  .views(self => ({
    get data() {
      const {kDVR, name} = self;
      return {kDVR, name};
    },
  }));
export const parseDVR = data => {
  return DVRModel.create({
    kDVR: data.KDVR,
    name: data.Name,
  });
};

const SiteModel = types
  .model({
    // pacId: types.maybeNull(types.number),
    key: types.identifierNumber,
    name: types.string,
    regionKey: types.maybeNull(types.number),
    defaultKDVR: types.maybeNull(types.number),
    dvrs: types.array(DVRModel),
  })
  .views(self => ({
    get dvrsCount() {
      return self.dvrs.length;
    },
    get data() {
      const {key, name, regionKey, defaultKDVR} = self;
      let dvrs = self.dvrs.map(dvr => dvr.data);
      return {key, name, regionKey, defaultKDVR, dvrs};
    },
  }))
  .actions(self => ({
    notifyUpdate(site) {
      if (self.key === site.Key) {
        let dvrs = Array.isArray(site.Childs)
          ? site.Childs.map(item => parseDVR(item))
          : [];
        self.name = site.Name;
        self.regionKey = site.RegionKey;
        self.defaultKDVR = site.DefaultKDVR;
        self.dvrs = dvrs;
      }
    },
  }));

const parseSite = _site => {
  let dvrs = Array.isArray(_site.Childs)
    ? _site.Childs.map(item => parseDVR(item)).sort((dvr1, dvr2) =>
        utils.compareStrings(dvr1.name, dvr2.name, false)
      )
    : [];
  return SiteModel.create({
    key: _site.SiteKey,
    name: _site.SiteName,
    pacId: _site.PacID,
    regionKey: _site.RegionKey == undefined ? null : _site.RegionKey,
    // defaultKDVR: _site.KDVR == undefined ? null : _site.KDVR,
    dvrs: dvrs,
  });
};

const parseSiteWithDVRs = _site => {
  let dvrs = Array.isArray(_site.Childs)
    ? _site.Childs.map(item => parseDVR(item)).sort((dvr1, dvr2) =>
        utils.compareStrings(dvr1.name, dvr2.name, false)
      )
    : [];
  return SiteModel.create({
    key: _site.Key,
    name: _site.Name,
    dvrs: dvrs,
  });
};

const RegionModel = types
  .model({
    // pacId: types.maybeNull(types.number),
    key: types.identifierNumber,
    userKey: types.maybeNull(types.number),
    name: types.optional(types.string, ''),
    parentId: types.maybeNull(types.number),
    descriptions: types.optional(types.string, ''),
    sites: types.array(types.reference(SiteModel)),
  })
  .views(self => ({
    get sitesCount() {
      return self.sites.length;
    },
  }))
  .actions(self => ({
    pushSite(site) {
      self.sites.push(site);
    },
  }));

const parseRegion = _regions => {
  // let sites = Array.isArray(_regions.SitesList)
  //   ? _regions.SitesList.map(item => parseSite(item))
  //   : [];
  return RegionModel.create({
    key: _regions.RegionKey,
    userKey: _regions.UserKey,
    name: _regions.RegionName,
    parentId: _regions.RegionParentId,
    descriptions: _regions.Description ?? '',
    // sites,
  });
};

export const SitesMapModel = types
  .model({
    regionsList: types.array(RegionModel),
    regionFilter: types.optional(types.string, ''),
    selectedRegion: types.maybeNull(types.reference(RegionModel)),
    // oldSitesList: types.array(SiteModel), // support old API
    sitesList: types.array(SiteModel),
    siteFilter: types.string,
    selectedSite: types.maybeNull(types.reference(SiteModel)),
    selectedDVR: types.maybeNull(types.reference(DVRModel)),
    dvrFilter: types.string,
    oamSites: types.array(types.reference(SiteModel)),
    oamSiteFilter: types.string,
    // isLoading: types.boolean,
    loadCounter: types.number,
  })
  .views(self => ({
    get isLoading() {
      return self.loadCounter > 0;
    },
    get sitesCount() {
      return self.filteredSites.length;
    },
    get selectedSiteDVRs() {
      if (!self.selectedSite) return [];
      const selectedSite = self.selectedSite.data;
      // __DEV__ && console.log('GOND resolved select site: ', selectedSite);
      return selectedSite.dvrs
        ? self.selectedSite.dvrs.map(dvr => dvr.data)
        : [];
    },
    get selectedSiteDefaultDVR() {
      return self.selectedSite
        ? self.selectedSite.defaultKDVR ?? self.selectedSite.dvrs[0]
        : null;
    },
    get filteredRegions() {
      return self.regionsList.filter(region =>
        region.name.toLowerCase().includes(self.regionFilter.toLowerCase())
      );
    },
    get filteredSites() {
      const res = self.selectedRegion
        ? self.selectedRegion.sites
        : self.sitesList;
      __DEV__ && console.log('GOND filteredSites: ', res);
      return res.filter(site =>
        site.name.toLowerCase().includes(self.siteFilter.toLowerCase())
      );
    },
    get filteredOamSites() {
      return self.oamSites
        .filter(site =>
          site.name.toLowerCase().includes(self.siteFilter.toLowerCase())
        )
        .sort((siteA, siteB) =>
          utils.compareStrings(siteA.name, siteB.name, false)
        );
    },
    get filteredDVRs() {
      return self.selectedSiteDVRs.filter(dvr =>
        dvr.name.toLowerCase().includes(self.dvrFilter.toLowerCase())
      );
    },
    get hasRegions() {
      return self.regionsList.length > 0;
    },
    // New API: get sites list from region data
    // get newSitesList() {
    //   return self.regionsList.reduce((result, region) => {
    //     region.sites.forEach(s => result.push(s));
    //     return result;
    //   }, []);
    // },
    // get sitesList() {
    //   return self.regionsList.length > 0
    //     ? self.newSitesList
    //     : self.oldSitesList;
    // },
  }))
  .actions(self => ({
    parseSitesList(data, haveDVRs = false) {
      let res = [];
      if (Array.isArray(data)) {
        res = data.map(item =>
          haveDVRs ? parseSiteWithDVRs(item) : parseSite(item)
        );
      } else {
        __DEV__ &&
          console.log('GOND Load sites list failed, data is not an array');
      }
      return res.sort((siteA, siteB) =>
        utils.compareStrings(siteA.name, siteB.name, false)
      );
    },
    edit(_editedSite) {
      let site = self.sitesList.find(item => item.key == _editedSite.Key);
      site.parse(_editedSite);
      self.sitesList.sort((s1, s2) =>
        utils.compareStrings(s1.name, s2.name, false)
      );
    },
    delete(_deletedSite) {
      let removedIdx = self.sitesList.findIndex(
        item => item.key == _deletedSite.Key
      );
      self.sitesList.splice(removedIdx, 1);
    },
    add(_newSite) {
      self.sitesList = self.sitesList.filter(item => item.key !== _newSite.Key);
      let key = _newSite.Key;
      let name = _newSite.Name;
      let dvrs = [];
      if (Array.isArray(_newSite.Childs)) {
        _newSite.Childs.forEach(item => {
          dvrs.push(
            DVRModel.create({
              kDVR: item.KDVR,
              name: item.Name,
            })
          );
        });
      }
      let site = SiteModel.create({
        key,
        name,
        dvrs,
      });
      self.sitesList.push(site);
      self.sitesList.sort((s1, s2) =>
        utils.compareStrings(s1.name, s2.name, false)
      );
    },
    selectRegion: flow(function* selectRegion(item) {
      self.selectedRegion = item.key;
      /*
      self.startLoad();
      try {
        let res = yield apiService.get(
          SiteRoute.controller,
          apiService.configToken.userId ?? 0, // item.key,
          SiteRoute.getRegionSites,
          {regionkey: item.key}
        );
        __DEV__ && console.log('GOND get all sites by region: ', res);
        // const sites = self.parseSitesList(res, true);
        res.forEach(_site => {
          if (self.sitesList.find(s => s.key == _site.SiteKey)) {
            self.selectedRegion.sites.push(_site.SiteKey);
          }
        });
      } catch (err) {
        __DEV__ && console.log('GOND Could not get sites data!', err);
        self.endLoad();
        return false;
      }
      self.endLoad();
      */
    }),
    setRegionFilter(value) {
      self.regionFilter = value;
    },
    selectSite(item) {
      __DEV__ && console.log(`selectSite item = `, item);
      self.selectedSite = item;
    },
    setSiteFilter(value) {
      self.siteFilter = value;
    },
    selectDVR(item) {
      if (utils.isNullOrUndef(item)) {
        self.selectedDVR = self.selectedSiteDefaultDVR;
        return;
      }
      self.selectedDVR = item;
    },
    deselectDVR() {
      self.selectedDVR = null;
    },
    setDVRFilter(value) {
      self.dvrFilter = value;
    },
    onSitesViewExit() {
      self.siteFilter = '';
      self.selectedRegion = null;
      self.selectedSite = null;
    },
    onNVRsViewExit() {
      self.dvrFilter = '';
      self.selectedSite = null;
    },
    startLoad() {
      self.loadCounter++;
    },
    endLoad() {
      self.loadCounter--;
    },
    getAllRegions: flow(function* getAllRegions() {
      // self.isLoading = true;
      self.startLoad();
      try {
        let res = yield apiService.get(
          SiteRoute.controller,
          apiService.configToken.userId ?? 0,
          SiteRoute.getAllRegions
        );
        __DEV__ && console.log('GOND get all regions: ', res);
        self.regionsList = res
          .map(reg => parseRegion(reg))
          .sort((reg1, reg2) =>
            utils.compareStrings(reg1.name, reg2.name, false)
          );
      } catch (err) {
        __DEV__ && console.log('GOND Could not get regions data!', err);
        // self.isLoading = false;
        self.endLoad();
        return false;
      }
      // self.isLoading = false;
      self.endLoad();
      return true;
    }),
    getAllSites: flow(function* () {
      // self.isLoading = true;
      self.startLoad();
      try {
        const canLoadRegion = yield self.getSiteTree();
        if (!canLoadRegion) {
          let res = yield apiService.get(
            SiteRoute.controller,
            SiteRoute.getAllWithDVR
          );
          __DEV__ && console.log('GOND get all sites: ', res);
          self.sitesList = self
            .parseSitesList(res, true)
            .sort((s1, s2) => utils.compareStrings(s1.name, s2.name, false));
        }
      } catch (err) {
        __DEV__ && console.log('GOND Could not get sites data!', err);
        // self.isLoading = false;
        self.endLoad();
        snackbarUtil.handleRequestFailed();
        return false;
      }
      // self.isLoading = false;
      self.endLoad();
      return true;
    }),
    /*
    getSiteTree: flow(function* () {
      self.startLoad();
      try {
        const [resRegions, resSites] = yield Promise.all([
          apiService.get(
            SiteRoute.controller,
            apiService.configToken.userId ?? 0,
            SiteRoute.getAllRegions
          ),
          self.getAllSites(),
        ]);
        __DEV__ && console.log('GOND get regions: ', resRegions);
        if (resRegions && resSites) {
          // TODO: Map sites to region by key, can improve?
          // self.sitesList.forEach(s => {
          //   if (s.regionKey) {
          //     const region = self.regionsList.find(reg => reg.key == s.regionKey);
          //     if (region) region.push(s.key);
          //   }
          // });
          if (Array.isArray(resRegions)) {
            self.regionsList = resRegions
              .map(r => {
                const region = parseRegion(r);
                const sites = r.SitesOfRegion;
                if (sites && Array.isArray(sites) && sites.length > 0) {
                  sites.forEach(_site => {
                    if (self.sitesList.find(s => s.key == _site.siteKey)) {
                      region.pushSite(_site.siteKey);
                    } else {
                      __DEV__ &&
                        console.log(
                          'GOND site not exist in sitesList: ',
                          _site
                        );
                    }
                  });
                }
                return region;
              })
              .filter(r => r.sites && r.sites.length > 0);
          } else {
            __DEV__ &&
              console.log(
                'GOND get site tree region data is not valid: ',
                resRegions
              );
            return false;
          }
          __DEV__ &&
            console.log('GOND get site tree result: ', self.regionsList);
          self.endLoad();
          return true;
        }
      } catch (err) {
        __DEV__ && console.log('GOND get site tree failed: ', err);
        snackbarUtil.handleRequestFailed();
      }
      self.endLoad();
      return false;
    }),
    */
    getSiteTree: flow(function* () {
      self.startLoad();
      self.regionsList = [];
      self.sitesList = [];
      try {
        const resRegions = yield apiService.get(
          SiteRoute.controller,
          apiService.configToken.userId ?? 0,
          SiteRoute.getAllRegions
        );
        __DEV__ && console.log('GOND get regions: ', resRegions);
        if (resRegions) {
          // TODO: Map sites to region by key, can improve?
          // self.sitesList.forEach(s => {
          //   if (s.regionKey) {
          //     const region = self.regionsList.find(reg => reg.key == s.regionKey);
          //     if (region) region.push(s.key);
          //   }
          // });
          if (Array.isArray(resRegions)) {
            self.sitesList = resRegions
              .reduce((result, reg) => {
                reg.SitesList.sort((a, b) =>
                  utils.compareStrings(a.SiteName, b.SiteName, false)
                );
                reg.SitesList.forEach(s => result.push(parseSite(s)));
                return result;
              }, [])
              .sort((s1, s2) => utils.compareStrings(s1.name, s2.name, false));

            self.regionsList = resRegions
              .map(reg => {
                const newRegion = parseRegion(reg);
                reg.SitesList.forEach(s => newRegion.pushSite(s.SiteKey));
                return newRegion;
              })
              .filter(r => r.sites && r.sites.length > 0)
              .sort((reg1, reg2) =>
                utils.compareStrings(reg1.name, reg2.name, false)
              );
          } else {
            __DEV__ &&
              console.log(
                'GOND get site tree region data is not valid: ',
                resRegions
              );
            return false;
          }
          __DEV__ &&
            console.log('GOND get site tree result: ', self.regionsList);
          self.endLoad();
          return true;
        }
      } catch (err) {
        __DEV__ && console.log('GOND get site tree failed: ', err);
        snackbarUtil.handleRequestFailed();
      }
      self.endLoad();
      return false;
    }),
    getSiteByKDVR: flow(function* (kDVR) {
      if (self.sitesList.length == 0) {
        yield self.getSiteTree();
      }

      let result = self.sitesList.find(site =>
        site.dvrs.find(dvr => dvr.kDVR == kDVR)
      );
      return result; // ? result.name : '';
    }),
    getDVR: flow(function* (kDVR) {
      if (self.sitesList.length == 0) {
        yield self.getSiteTree();
      }

      let result = null;
      self.sitesList.find(site => {
        result = site.dvrs.find(dvr => dvr.kDVR == kDVR);
        return result;
      });
      return result; // ? result.name : '';
    }),
    getSiteByKey: flow(function* (siteKey) {
      if (self.sitesList.length == 0) {
        yield self.getSiteTree();
      }

      let result = self.sitesList.find(site => site.key == siteKey);
      return result;
    }),
    getOAMSites: flow(function* getOAMSites() {
      self.startLoad();
      try {
        let res = yield apiService.get(
          SiteRoute.controller,
          // apiService.configToken.userId ?? 0,
          SiteRoute.getSiteOam
        );
        __DEV__ && console.log('GOND get OAM sites: ', JSON.stringify(res));
        self.oamSites = res.map(item => {
          self.add(item);
          console.log('HAI item.Key = ' + item.Key);
          return item.Key;
        });
      } catch (err) {
        __DEV__ && console.log('GOND Could not get sites data! ', err);
        self.endLoad();
        return false;
      }
      self.endLoad();
      return true;
    }),
    updateSite(_site) {
      self.sitesList.map(site => site.notifyUpdate(_site));
    },
    cleanUp() {
      applySnapshot(self, storeDefault);
    },
  }));

const storeDefault = {
  sitesList: [],
  selectedSite: null,
  siteFilter: '',
  selectedDVR: null,
  dvrFilter: '',
  oamSites: [],
  oamSiteFilter: '',
  // isLoading: false,
  loadCounter: 0,
};

const sitesStore = SitesMapModel.create(storeDefault);

export default sitesStore;
