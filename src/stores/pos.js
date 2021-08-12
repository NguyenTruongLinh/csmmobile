import {flow, types, applySnapshot} from 'mobx-state-tree';
// import SiteStore from './sites';
import BigNumber from 'bignumber.js';
import BigNumberPrimitive from './types/bignumber';

import userStore from './user';
import apiService from '../services/api';

import {Exception} from '../consts/apiRoutes';
import snackbar from '../util/snackbar';

const ExceptionFilterModel = types.model({
  dateFrom: types.Date,
  dateTo: types.Date,
  selectedSites: types.array(types.number),
});

const ExceptionModel = types.model({
  riskFactor: types.number,
  countRisk: types.number,
  totalAmount: types.number,
  percentToSale: types.number,
  totalTran: types.number,
  date: types.string, // Date?
  employerId: types.maybeNull(types.number),
  employerName: types.maybeNull(types.string),
  storeId: types.maybeNull(types.number),
  storeName: types.maybeNull(types.string),
  exceptionAmount: types.number,
  siteKey: types.number,
  siteName: types.string,
  pacId: types.number,
});

const parseException = _ex => {
  return ExceptionModel.create({
    riskFactor: _ex.RiskFactor,
    countRisk: _ex.CountRisk,
    totalAmount: _ex.TotalAmount,
    percentToSale: _ex.PercentToSale,
    totalTran: _ex.TotalTran,
    date: _ex.Date,
    employerId: _ex.EmployerId,
    employerName: _ex.EmployerName,
    storeId: _ex.StoreId,
    storeName: _ex.StoreName,
    exceptionAmount: _ex.ExceptionAmount,
    siteKey: _ex.SiteKey,
    siteName: _ex.SiteName,
    pacId: _ex.PacId,
  });
};

const ExceptionGroupModel = types.model({
  // id: types.identifier, // TODO
  sumRiskFactors: types.number,
  totalAmount: types.number,
  totalRatio: BigNumberPrimitive,
  numberSite: types.number,
  totalRiskFactors: types.number,
  exceptionAmount: types.number,
  data: types.array(ExceptionModel),
  currentPage: types.number,
  totalPages: types.number,
  pageSize: types.number,
  // childs: types.array(types.reference(ExceptionTypeModel)), // todo
});
// .actions(self => ({
//   parse(_exception) {
//     self.sumRiskFactors = _exception.SumRiskFactors;
//     self.totalAmount = _exception.TotalAmount;
//     self.totalRatio = BigNumber(_exception.TotalRatio);
//     self.numberSite = _exception.NumberSite;
//     self.totalRiskFactors = _exception.TotalRiskFactors;
//     self.exceptionAmount = _exception.ExceptionAmount;
//     self.currentPage = _exception.CurrentPage;
//     self.totalPages = _exception.TotalPages;
//     self.pageSize = _exception.PageSize;

//     self.data = [];
//     if (Array.isArray(_exception.Date)) {
//       _exception.Date.forEach(item => {
//         self.data.push(
//           getDefaultException().parse(item)
//         );
//       });
//     }
//   },
// }));

const parseExceptionGroup = _data => {
  return ExceptionGroup.create({
    sumRiskFactors: _data.SumRiskFactors,
    totalAmount: _data.TotalAmount,
    totalRatio: BigNumber(_data.TotalRatio),
    numberSite: _data.NumberSite,
    totalRiskFactors: _data.TotalRiskFactors,
    exceptionAmount: _data.ExceptionAmount,
    currentPage: _data.CurrentPage,
    totalPages: _data.TotalPages,
    pageSize: _data.PageSize,
    data:
      _data.Data && Array.isArray(_data.Data)
        ? _data.Data.map(_ex => parseException(_ex))
        : [],
  });
};

const ExceptionParamsModel = types
  .model({
    // Site: types.maybeNull(),
    siteKey: types.number,
    sort: types.number,
    groupBy: types.number,
    emprisk: types.string,
    page: types.number,
    pSize: types.number,
    sDate: types.string,
    eDate: types.string,
    sites: types.string,
  })
  .actions(self => ({
    parse(_params) {
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

const ExceptionTypeModel = types
  .model({
    id: types.identifierNumber,
    name: types.string,
    desc: types.string,
    flagTime: types.maybeNull(types.string),
    typeWeight: types.number,
    color: types.string,
    isSystem: types.boolean,
    readOnly: types.boolean,
    userId: types.number,
  })
  .views(self => ({
    get data() {
      return {...self};
    },
  }));

const parseExceptionType = _data =>
  ExceptionTypeModel.create({
    id: _data.Id,
    name: _data.Name,
    desc: _data.Desc,
    flagTime: _data.FlagTime,
    typeWeight: _data.TypeWeight,
    color: _data.Color,
    isSystem: _data.IsSystem,
    readOnly: _data.ReadOnly,
    userId: _data.UserID,
  });

export const POSModel = types
  .model({
    showChartView: types.boolean,
    param: types.maybeNull(ExceptionParamsModel),
    searchSiteText: types.string,
    // isBackFromFCM: types.boolean,
    exceptionsGroupBySite: types.array(ExceptionGroupModel),
    // exceptionsGroupByEmployee: types.array(ExceptionGroupModel), // use with computed views
    exceptionTypes: types.array(ExceptionTypeModel),
  })
  .views(self => ({
    get exceptionTypesData() {
      return self.exceptionTypes.map(item => item.data);
    },
  }))
  .actions(self => ({
    getTransactionTypes: flow(function* getTransactionTypes() {
      let res = yield apiService.get(
        Exception.controller,
        apiService.configToken.userId,
        Exception.getTransactionTypes
      );

      // __DEV__ && console.log('GOND exceptionTypes = ', res);
      if (!res || res.error) {
        snackbar.handleRequestFailed();
      }
      self.exceptionTypes = Array.isArray(res)
        ? res.map(item => parseExceptionType(item))
        : [];
      // __DEV__ &&
      //   console.log('GOND self.exceptionTypes = ', self.exceptionTypes);
    }),
    cleanUp() {
      applySnapshot(self, storeDefault);
    },
  }));

const storeDefault = {
  showChartView: true,
  param: null,
  searchSiteText: '',
  // isBackFromFCM: types.boolean(false),
  exceptionsGroupBySite: [],
  exceptionTypes: [],
};

const exceptionStore = POSModel.create(storeDefault);

export default exceptionStore;
