import { types } from 'mobx-state-tree';
// import SiteStore from './sites';
import BigNumber from 'bignumber.js';
import BigNumberPrimitive from './types/bignumber';

const ExceptionFilterModel = types.model({
  dateFrom: types.Date,
  dateTo: types.Date,
  selectedSites: types.array(types.integer)
})

const ExceptionModel = types.model({
  riskFactor: types.number,
  countRisk: types.integer,
  totalAmount: types.number,
  percentToSale: types.number,
  totalTran: types.integer,
  date: types.string, // Date?
  employerId: types.maybeNull(types.integer),
  employerName: types.maybeNull(types.string),
  storeId: types.maybeNull(types.integer),
  storeName: types.maybeNull(types.string),
  exceptionAmount: types.number,
  siteKey: types.integer,
  siteName: types.string,
  pacId: types.integer,
}).actions(self => ({
  load(_exception) {
    self.riskFactor = _exception.RiskFactor
    self.countRisk = _exception.CountRisk
    self.totalAmount = _exception.TotalAmount
    self.percentToSale = _exception.PercentToSale
    self.totalTran = _exception.TotalTran
    self.date = _exception.Date
    self.employerId = _exception.EmployerId
    self.employerName = _exception.EmployerName
    self.storeId = _exception.StoreId
    self.storeName = _exception.StoreName
    self.exceptionAmount = _exception.ExceptionAmount
    self.siteKey = _exception.SiteKey
    self.siteName = _exception.SiteName
    self.pacId = _exception.PacId
  },
}));

const ExceptionGroupModel = types.model({
  sumRiskFactors: types.number,
  totalAmount: types.number,
  totalRatio: BigNumberPrimitive,
  numberSite: types.integer,
  totalRiskFactors: types.number,
  exceptionAmount: types.number,
  data: types.array(ExceptionModel),
  currentPage: types.integer,
  totalPages: types.integer,
  pageSize: types.integer,
  childs: types.maybeNull(types.array(ExceptionGroupModel)),
}).actions(self => ({
  load(_exception) {
    self.sumRiskFactors = _exception.SumRiskFactors
    self.totalAmount = _exception.TotalAmount
    self.totalRatio = BigNumber(_exception.TotalRatio)
    self.numberSite = _exception.NumberSite
    self.totalRiskFactors = _exception.TotalRiskFactors
    self.exceptionAmount = _exception.ExceptionAmount
    self.currentPage = _exception.CurrentPage
    self.totalPages = _exception.TotalPages
    self.pageSize = _exception.PageSize

    self.data = [];
    if (Array.isArray(_exception.Date)) {
      _exception.Date.forEach(item => {
        self.data.push(ExceptionModel.create().load(item));
      });
    }
  },
}));

const ExceptionParamsModel = types.model({
  // Site: types.maybeNull(),
  siteKey: types.integer,
  sort: types.integer,
  groupBy: types.integer,
  emprisk: types.string,
  page: types.integer,
  pSize: types.integer,
  sDate: types.string,
  eDate: types.string,
  sites: types.string,
}).actions(self => ({
  load(_params) {
    self.sites = _params.sites;
    self.sort = _params.sort;
    self.groupBy = _params.groupby;
    self.emprisk = _params.emprisk;
    self.page = _params.page;
    self.pSize = _params.psize;
    self.sDate = _params.sdate;
    self.eDate = _params.edate;
    self.sites = _params.sites;
    
    self.siteKey = ''; // add later?
  },
}));

const exceptionStore = types.model({
  showChartView: types.boolean,
  param: types.maybeNull(ExceptionParamsModel),
  searchSiteText: types.string,
  // isBackFromFCM: types.boolean(false),
  exceptionsGroupBySite: types.array(ExceptionGroupModel),
  // exceptionsGroupByEmployee: types.array(ExceptionGroupModel), // use with computed views
}).views(self => ({

})).actions(self => ({

})).create();

export default exceptionStore;