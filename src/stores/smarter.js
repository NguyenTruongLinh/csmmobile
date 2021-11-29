import {flow, types, applySnapshot, getSnapshot} from 'mobx-state-tree';
// import SiteStore from './sites';
import BigNumber from 'bignumber.js';
import BigNumberPrimitive from './types/bignumber';
import {DateTime} from 'luxon';

import userStore from './user';
import apiService from '../services/api';

import {Exception} from '../consts/apiRoutes';
import {
  DateFormat,
  ExceptionSortField,
  ExceptionSortFieldName,
  GroupByException,
} from '../consts/misc';
import snackbar from '../util/snackbar';

const ExceptionFilterModel = types.model({
  dateFrom: types.Date,
  dateTo: types.Date,
  selectedSites: types.array(types.number),
});

const EmployeeExceptionModel = types.model({
  riskFactor: types.number,
  countRisk: types.number,
  totalAmount: types.number,
  percentToSale: types.number,
  totalTran: types.number,
  date: types.string, // Date?
  employeeId: types.maybeNull(types.number),
  employeeName: types.maybeNull(types.string),
  // storeId: types.maybeNull(types.number),
  // storeName: types.maybeNull(types.string),
  exceptionAmount: types.number,
  // siteKey: types.number,
  // siteName: types.string,
  // pacId: types.number,
  // employees: types.array(types)
});

const SiteExceptionModel = types.model({
  riskFactor: types.number,
  countRisk: types.number,
  totalAmount: types.number,
  percentToSale: types.number,
  totalTran: types.number,
  date: types.string, // Date?
  // employerId: types.maybeNull(types.number),
  // employerName: types.maybeNull(types.string),
  storeId: types.maybeNull(types.number),
  storeName: types.maybeNull(types.string),
  exceptionAmount: types.number,
  siteKey: types.number,
  siteName: types.string,
  pacId: types.number,
  employees: types.array(EmployeeExceptionModel),
});

const parseSiteException = _ex => {
  return SiteExceptionModel.create({
    riskFactor: _ex.RiskFactor,
    countRisk: _ex.CountRisk,
    totalAmount: _ex.TotalAmount,
    percentToSale: _ex.PercentToSale,
    totalTran: _ex.TotalTran,
    date: _ex.Date,
    // employerId: _ex.EmployerId,
    // employerName: _ex.EmployerName,
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
  data: types.array(SiteExceptionModel),
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
  return ExceptionGroupModel.create({
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
        ? _data.Data.map(_ex => parseSiteException(_ex))
        : [],
  });
};

const ExceptionParamsModel = types
  .model({
    // Site: types.maybeNull(),
    // siteKey: types.maybeNull(types.number),
    sort: types.number,
    groupBy: types.number,
    emprisk: types.string,
    page: types.number,
    pSize: types.number,
    sDate: types.string,
    eDate: types.string,
    // sites: types.maybeNull(types.string),
    sites: types.array(types.number),
  })
  .actions(self => ({
    // setSite(siteKey) {
    //   self.siteKey = siteKey;
    // },
    setParams(params) {
      if (
        !params ||
        typeof params != 'object' ||
        Object.keys(params).length == 0
      ) {
        console.log(
          'GOND ExceptionParams params input is not an object: ',
          params
        );
        return;
      }
      const {
        // siteKey,
        sort,
        groupBy,
        emprisk,
        page,
        pSize,
        sDate,
        eDate,
        sites,
      } = params;

      // self.siteKey = siteKey ?? self.siteKey;
      self.sort = sort ?? self.sort;
      self.groupBy = groupBy ?? self.groupBy;
      self.emprisk = emprisk ?? self.emprisk;
      self.page = page ?? self.page;
      self.pSize = pSize ?? self.pSize;
      self.sDate = sDate ?? self.sDate;
      self.eDate = eDate ?? self.eDate;
      self.sites = sites ?? self.sites;
    },
  }));

const parseExceptionParams = _params => {
  return ExceptionParamsModel.create({
    sites: _params.sites,
    sort: _params.sort,
    groupBy: _params.groupby,
    emprisk: _params.emprisk,
    page: _params.page,
    pSize: _params.psize,
    sDate: _params.sdate,
    eDate: _params.edate,
    sites: _params.sites,

    siteKey: '', // add later?
  });
};

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
    name: _data.Name ?? '',
    desc: _data.Desc ?? '',
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
    filterParams: types.maybeNull(ExceptionParamsModel),
    groupFilter: types.string,
    // isBackFromFCM: types.boolean,
    exceptionsGroup: types.maybeNull(ExceptionGroupModel),
    // exceptionsGroupByEmployee: types.array(ExceptionGroupModel), // use with computed views
    exceptionTypes: types.array(ExceptionTypeModel),

    isLoading: types.boolean,
    isGroupLoading: types.boolean,

    sortField: types.optional(types.number, ExceptionSortField.RatioToSale),
  })
  .views(self => ({
    get exceptionTypesData() {
      return self.exceptionTypes.map(item => item.data);
    },
    get totalRiskFactors() {
      return self.exceptionsGroup ? self.exceptionsGroup.totalRiskFactors : 0;
    },
    get startDateTime() {
      return self.filterParams && self.filterParams.sDate
        ? DateTime.fromFormat(
            self.filterParams.sDate,
            DateFormat.QuerryDateTime,
            {zone: 'utc'}
          )
        : DateTime.now().setZone('utc').minus({days: 1}).startOf('day');
    },
    get endDateTime() {
      return self.filterParams && self.filterParams.eDate
        ? DateTime.fromFormat(
            self.filterParams.eDate,
            DateFormat.QuerryDateTime,
            {zone: 'utc'}
          )
        : DateTime.now().setZone('utc').minus({days: 1}).endOf('day');
    },
    // get sortFieldName() {
    //   return ExceptionSortFieldName[
    //     self.filterParams
    //       ? self.filterParams.sort ?? ExceptionSortField.RiskFactor
    //       : ExceptionSortField.RiskFactor
    //   ];
    // },
    get sortFieldName() {
      return ExceptionSortFieldName[self.sortField];
    },
    get exceptionsGroupData() {
      return self.exceptionsGroup ? self.exceptionsGroup.data : [];
    },
    get filteredGroupsData() {
      return self.groupFilter.length == 0
        ? self.exceptionsGroupData
        : self.exceptionsGroupData.filter(d =>
            d.siteName
              .toLowerCase()
              .includes(
                self.groupFilter.toLowerCase() ||
                  d.employees.find(e =>
                    e.employerName
                      .toLowerCase()
                      .includes(self.groupFilter.toLowerCase())
                  )
              )
          );
    },
    get chartData() {
      const data = self.exceptionsGroup
        ? self.exceptionsGroup.data.map(x => {
            let value = 0;
            switch (self.sortField) {
              case ExceptionSortField.RiskFactor:
                value = x.riskFactor;
                break;
              case ExceptionSortField.TotalAmount:
                value = x.totalAmount;
                break;
              case ExceptionSortField.RatioToSale:
                value = x.percentToSale;
                break;
              default:
                console.log('GOND chartValues unknown field: ', self.sortField);
                break;
            }

            return {
              name: x.siteName,
              value,
              key: x.siteKey,
            };
          })
        : [];

      return data.sort((a, b) => a.value - b.value);
    },
    get displaySortFields() {
      return Object.values(ExceptionSortField).filter(
        x => x != ExceptionSortField.Employee && x != ExceptionSortField.Count
      );
    },
  }))
  .actions(self => ({
    // #region Setters
    setDefaultParams(siteKeys) {
      const yesterday = DateTime.now().minus({days: 1});

      self.filterParams = ExceptionParamsModel.create({
        sites: siteKeys,
        sort: ExceptionSortField.RatioToSale,
        groupBy: GroupByException.SITE,
        emprisk: 'emprisk',
        page: 1,
        pSize: 20,
        // sDate: yesterday.startOf('day').toFormat(DateFormat.QuerryDateTime),
        sDate: '20210901000000',
        eDate: yesterday.endOf('day').toFormat(DateFormat.QuerryDateTime),

        // siteKey: '', // add later?
      });
    },
    setFilterParams(params) {
      self.filterParams.setParams(params);
    },
    setGroupFilter(value) {
      self.groupFilter = value;
    },
    setSortField(value) {
      if (value < 0 || value >= ExceptionSortField.Count) {
        console.log('GOND setSortField out of bound: ', value);
        return;
      }
      self.sortField = value;
    },
    // #endregion Setters
    // #region Get data
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
    getExceptionsSummary: flow(function* () {
      self.isLoading = true;
      __DEV__ &&
        console.log(
          'GOND getExceptionsSummary, params = ',
          getSnapshot(self.filterParams)
        );
      try {
        const res = yield apiService.get(
          Exception.controller,
          '',
          '',
          self.filterParams
        );
        __DEV__ && console.log('GOND getExceptionsSummary = ', res);

        self.exceptionsGroup = parseExceptionGroup(res);
      } catch (error) {
        __DEV__ && console.log('GOND getExceptionsSummary error = ', error);
      }
      self.isLoading = false;
    }),
    getGroupDetailData: flow(function* (siteKey) {
      let siteIndex = self.exceptionsGroupData.findIndex(
        d => d.siteKey == siteKey
      );
      if (siteIndex < 0) {
        console.log('GOND get Exception group data, site not found!');
        return;
      }
      self.isGroupLoading = true;
      // self.filterParams.setParams({siteKey});
      if (self.exceptionsGroupData[siteIndex].employees.length > 0) {
        __DEV__ &&
          console.log(
            'GOND get Exception group data, site data already existed!'
          );
        return;
      }
      try {
        const res = yield apiService.get(Exception.controller, '', '', {
          ...self.filterParams,
          groupBy: GroupByException.EMPL,
          sites: [siteKey].toString(),
          // siteKey,
        });
        __DEV__ && console.log('GOND getGroupDetailData = ', res);

        if (
          !res ||
          !res.Data ||
          !Array.isArray(res.Data) ||
          res.Data.length == 0
        ) {
          __DEV__ && console.log('GOND getGroupDetailData no data:', res);
          return;
        }
        self.exceptionsGroupData[siteIndex].employees = res.Data.map(item =>
          EmployeeExceptionModel.create({
            riskFactor: item.RiskFactor,
            countRisk: item.CountRisk,
            totalAmount: item.TotalAmount,
            percentToSale: item.PercentToSale,
            totalTran: item.TotalTran,
            date: item.Date,
            employeeId: item.EmployerId,
            employeeName: item.EmployerName,
            exceptionAmount: item.ExceptionAmount,
          })
        );
      } catch (error) {
        __DEV__ && console.log('GOND getGroupDetailData error = ', error);
      }
      self.isGroupLoading = false;
    }),
    // #endregion Get data
    cleanUp() {
      applySnapshot(self, storeDefault);
    },
  }));

const storeDefault = {
  showChartView: true,
  filterParams: null,
  groupFilter: '',
  // isBackFromFCM: types.boolean(false),
  exceptionsGroup: null,
  exceptionTypes: [],
  isLoading: false,
  isGroupLoading: false,
};

const exceptionStore = POSModel.create(storeDefault);

export default exceptionStore;
