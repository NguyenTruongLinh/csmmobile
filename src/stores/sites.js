import {types, flow} from 'mobx-state-tree';

import {Route, Site as SiteRoute} from '../consts/apiRoutes';
import {Login as LoginTxt} from '../localization/texts';
import apiService from '../services/api';
import utils from '../util/general';

const DVRModel = types
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
const parseDVR = data => {
  return DVRModel.create({
    kDVR: data.KDVR,
    name: data.Name,
  });
};

const SiteModel = types
  .model({
    pacId: types.maybeNull(types.number),
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
  .actions(self => ({}));

const parseSite = _site => {
  let dvrs = Array.isArray(_site.Childs)
    ? _site.Childs.map(item => parseDVR(item))
    : [];
  return SiteModel.create({
    key: _site.SiteKey,
    name: _site.SiteName,
    pacId: _site.PacID,
    regionKey: _site.RegionKey == undefined ? null : _site.RegionKey,
    defaultKDVR: _site.KDVR == undefined ? null : _site.KDVR,
    dvrs: dvrs,
  });
};

const parseSiteWithDVRs = _site => {
  let dvrs = Array.isArray(_site.Childs)
    ? _site.Childs.map(item => parseDVR(item))
    : [];
  return SiteModel.create({
    key: _site.Key,
    name: _site.Name,
    dvrs: dvrs,
  });
};

export const SitesMapModel = types
  .model({
    sitesList: types.array(SiteModel),
    siteFilter: types.string,
    selectedSite: types.maybeNull(types.reference(SiteModel)),
    selectedDVR: types.maybeNull(types.reference(DVRModel)),
    dvrFilter: types.string,
    oamSites: types.array(types.reference(SiteModel)),
    oamSiteFilter: types.string,
    isLoading: types.boolean,
  })
  .views(self => ({
    get sitesCount() {
      return self.sitesList.length;
    },
    get selectedSiteDVRs() {
      if (!self.selectedSite) return [];
      const selectedSite = self.selectedSite.data;
      // __DEV__ && console.log('GOND resolved select site: ', selectedSite);
      return selectedSite.dvrs
        ? self.selectedSite.dvrs.map(dvr => dvr.data)
        : [];
    },
    get filteredSites() {
      return self.sitesList.filter(site =>
        site.name.toLowerCase().includes(self.siteFilter.toLowerCase())
      );
    },
    get filteredDVRs() {
      return self.selectedSiteDVRs.filter(dvr =>
        dvr.name.toLowerCase().includes(self.dvrFilter.toLowerCase())
      );
    },
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
        utils.compareStrings(siteA.name, siteB.name)
      );
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
      //   dvrs: Array.isArray(_newSite.Childs)
      //     ? _newSite.Childs.forEach(item => {
      //       self.dvrs.push(DVRModel.create({
      //         kDVR: item.KDVR,
      //         name: item.Name,
      //       }))
      //     })
      //     : []
      // });
      let site = SiteModel.create({
        key: _newSite.key,
        name: _newSite.Name,
        dvrs: [],
      }).parse(_newSite);
      self.sitesList.push(site);
      self.sitesList.sort(item => item.name);
    },
    selectSite(item) {
      self.selectedSite = item.key;
    },
    setSiteFilter(value) {
      self.siteFilter = value;
    },
    selectDVR(item) {
      self.selectedDVR = item.kDVR;
    },
    setDVRFilter(value) {
      self.dvrFilter = value;
    },
    getAllSites: flow(function* getAllSites() {
      self.isLoading = true;
      try {
        let res = yield apiService.get(
          SiteRoute.controller,
          SiteRoute.getAllWithDVR
        );
        __DEV__ && console.log('GOND get all sites: ', res);
        self.sitesList = self.parseSitesList(res, true);
      } catch (err) {
        __DEV__ && console.log('GOND Could not get sites data!', err);
        self.isLoading = false;
        return false;
      }
      self.isLoading = false;
      return true;
    }),
    getOAMSites: flow(function* getOAMSites() {
      try {
        let res = yield apiService.get(
          SiteRoute.controller,
          SiteRoute.getSiteOam
        );
        __DEV__ && console.log('GOND get OAM sites: ', res);
        self.oamSites = res.map(item => item.key);
      } catch (err) {
        __DEV__ && console.log('GOND Could not get sites data! ', err);
        return false;
      }
      return true;
    }),
  }));

const sitesStore = SitesMapModel.create({
  sitesList: [],
  selectedSite: null,
  siteFilter: '',
  selectedDVR: null,
  dvrFilter: '',
  oamSites: [],
  oamSiteFilter: '',
  isLoading: false,
});

export default sitesStore;
