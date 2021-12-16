import {flow, types, applySnapshot, getSnapshot} from 'mobx-state-tree';
// import SiteStore from './sites';
import BigNumber from 'bignumber.js';
import BigNumberPrimitive from './types/bignumber';
import {DateTime} from 'luxon';
import Share from 'react-native-share';

import apiService from '../services/api';

import snackbar from '../util/snackbar';
import {getRandomId, isValidHttpUrl, stringtoBase64} from '../util/general';

import {
  Exception as ExceptionRoute,
  Transaction as TransactionRoute,
  File as FileRoute,
  CommonActions,
} from '../consts/apiRoutes';
import {
  DateFormat,
  ExceptionSortField,
  ExceptionSortFieldName,
  GroupByException,
} from '../consts/misc';
import {
  COMMON as COMMON_TXT,
  SMARTER as SMARTER_TXT,
} from '../localization/texts';

import {No_Image} from '../consts/images';

const ExceptionFilterModel = types.model({
  dateFrom: types.Date,
  dateTo: types.Date,
  selectedSites: types.array(types.number),
});

const EmployeeExceptionModel = types.model({
  id: types.optional(types.identifier, () => getRandomId()),
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
  siteKey: types.number,
  siteName: types.string,
  pacId: types.number,
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
        ? _data.Data.map(_ex => parseSiteException(_ex)).sort(
            (x, y) => y.totalRiskFactors - x.totalRiskFactors
          )
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
  .views(self => ({
    get requestParams() {
      return {
        sort: self.sort,
        groupby: self.groupBy,
        emprisk: self.emprisk,
        page: self.page,
        psize: self.pSize,
        sdate: self.sDate,
        edate: self.eDate,
        sites: self.sites,
      };
    },
  }))
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

const ExceptionTypeModel = types.model({
  id: types.identifierNumber,
  name: types.string,
  desc: types.string,
  flagTime: types.maybeNull(types.string),
  typeWeight: types.number,
  color: types.string,
  isSystem: types.boolean,
  readOnly: types.boolean,
  userId: types.maybeNull(types.number),
});
// .views(self => ({
//   get data() {
//     return {...self};
//   },
// }));

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

const PaymentTaxModel = types.model({
  id: types.number,
  name: types.string,
  amount: types.number,
  isHighlightName: types.optional(types.boolean, false),
  isHighlightValue: types.optional(types.boolean, false),
  color: types.maybeNull(types.string),
});

const parsePaymentTaxData = _data =>
  PaymentTaxModel.create({
    id: _data.Id,
    name: _data.Name,
    amount: _data.Amount ?? 0,
    isHighlightName: _data.IsHighlightName,
    isHighlightValue: _data.IsHighlightValue,
    color: _data.Color,
  });

const TransactionItemModel = types.model({
  id: types.number,
  itemLine: types.number,
  quantity: types.number,
  total: types.number,
  itemCodeName: types.string,
  descriptionName: types.string,
});

const parseTransactionItem = item =>
  TransactionItemModel.create({
    id: item.Id,
    itemLine: item.ItemLine,
    quantity: item.Qty,
    total: item.Total,
    itemCodeName: item.ItemCodeName ?? '',
    descriptionName: item.DescriptionName ?? '',
  });

const TransactionModel = types
  .model({
    // id: types.optional(types.identifier, () => getRandomId()),
    // tranId: types.number,
    tranId: types.identifierNumber,
    tranNo: types.number,
    pacId: types.number,
    storeId: types.maybeNull(types.number),
    storeName: types.optional(types.string, 'N/A'),
    employeeId: types.maybeNull(types.number),
    employeeName: types.optional(types.string, ''),
    registerId: types.maybeNull(types.number),
    registerName: types.optional(types.string, 'N/A'),
    camId: types.maybeNull(types.number),
    camName: types.optional(types.string, ''),
    shiftId: types.maybeNull(types.number),
    shiftName: types.optional(types.string, 'N/A'),
    checkId: types.maybeNull(types.number),
    checkName: types.optional(types.string, 'N/A'),
    cardId: types.maybeNull(types.number),
    cardName: types.optional(types.string, 'N/A'),
    terminalId: types.maybeNull(types.number),
    terminalName: types.optional(types.string, 'N/A'),
    tranDate: types.string,
    dvrDate: types.string,
    dvrStartDate: types.maybeNull(types.string),
    // year: types.number,
    // quarter: types.number,
    // month: types.number,
    // week: types.number,
    // day: types.number,
    // hour: types.number,
    subTotal: types.maybeNull(types.number),
    changeAmount: types.maybeNull(types.number),
    total: types.maybeNull(types.number),
    taxs: types.array(PaymentTaxModel),
    payments: types.array(PaymentTaxModel),
    exceptionTypes: types.array(types.reference(ExceptionTypeModel)),
    notes: types.array(types.string),
    exceptionAmount: types.maybeNull(types.number),
    detail: types.array(TransactionItemModel),
  })
  .volatile(self => ({
    snapshot: null,
    media: null,
    isCloud: false,
    mediaSize: 0,
  }))
  .views(self => ({
    get orderTime() {
      return DateTime.fromISO(self.tranDate, {zone: 'utc'}).toFormat(
        DateFormat.TranDate
      );
    },
    get hasVideo() {
      return self.media && self.mediaSize > 0;
    },
    get searchTime() {
      const date = new Date(self.dvrStartDate ?? self.dvrDate);
      date.setSeconds(date.getSeconds() - 5);
      return date.toISOString();
    },
    get kDVR() {
      return self.pacId;
    },
    get id() {
      return self.tranId;
    },
  }))
  .actions(self => ({
    saveImage(data) {
      if (!data.isExist) return;
      self.media = data.url_media;
      self.snapshot = data.url_thumnail;
      self.isCloud = data.isCloud;
      if (data.MediaSize && data.MediaSize > 0) self.mediaSize = data.MediaSize;

      if (!self.isCloud) {
        // get Video url
        try {
          self.media = apiService.getMediaUrl(
            FileRoute.controller,
            FileRoute.getMedia,
            self.media
          );
          __DEV__ &&
            console.log('GOND Get transaction video url: ', self.media);

          return self.media;
        } catch (error) {
          __DEV__ &&
            console.log('GOND Get transaction video url faled: ', error);
        }
      }
    },
    addDetails(data) {
      if (!data || !Array.isArray(data)) {
        __DEV__ &&
          console.log('GOND Transaction detail data not valid: ', data);
        return;
      }

      self.detail = data.map(item => parseTransactionItem(item));
    },
    // getVideoUrl() {
    //   if (!self.media || self.mediaSize <= 0) {
    //     __DEV__ &&
    //       console.log(
    //         'GOND Get trans video url, nomedia: ',
    //         self.media,
    //         self.mediaSize
    //       );
    //     return null;
    //   }
    //   if (self.isCloud || isValidHttpUrl(self.media)) return self.media;

    //   try {
    //     self.media = apiService.getMediaUrl(
    //       FileRoute.controller,
    //       FileRoute.getMedia,
    //       self.media
    //     );
    //     __DEV__ && console.log('GOND Get transaction video url: ', self.media);

    //     return self.media;
    //   } catch (error) {
    //     __DEV__ && console.log('GOND Get transaction video url faled: ', error);
    //   }
    // },
    downloadVideo: flow(function* () {
      try {
        if (!self.media || self.mediaSize == 0) {
          __DEV__ && console.log('GOND Download video transaction no media');
          return;
        }
        const res = yield apiService.downloadFile(self.media);
        if (res) {
          Share.open({
            url: `${res.path()}`,
            title: COMMON_TXT.CMS_APP,
            message: SMARTER_TXT.SHARE_MESSAGE,
            subject: SMARTER_TXT.SHARE_SUBJECT,
          });
        }
      } catch (err) {
        console.log('GOND Download video transaction failed: ', err);
      }
    }),
  }));

const _parseTransactionData = (_data, exceptionTypesConfig) =>
  TransactionModel.create({
    tranId: _data.TranId,
    tranNo: _data.TranNo,
    pacId: _data.PacId,
    storeId: _data.StoreId,
    storeName: _data.StoreName,
    employeeId: _data.EmployeeId,
    employeeName: _data.EmployeeName,
    registerId: _data.RegisterId,
    registerName: _data.RegisterName,
    camId: _data.CamId,
    camName: _data.CamName,
    shiftId: _data.ShiftId,
    ShiftName: _data.ShiftName,
    checkId: _data.CheckId,
    checkName: _data.CheckName,
    cardId: _data.CardId,
    cardName: _data.CardName,
    terminalId: _data.TerminalId,
    terminalName: _data.TerminalName,
    tranDate: _data.TranDate,
    dvrDate: _data.DvrDate,
    dvrStartDate: _data.DvrStartDate,
    // year: types.number,
    // quarter: types.number,
    // month: types.number,
    // week: types.number,
    // day: types.number,
    // hour: types.number,
    subTotal: _data.SubTotal,
    changeAmount: _data.ChangeAmount,
    total: _data.Total,
    taxs:
      _data.Taxs && Array.isArray(_data.Taxs)
        ? _data.Taxs.map(item => parsePaymentTaxData(item))
        : [],
    payments:
      _data.Payments && Array.isArray(_data.Payments)
        ? _data.Payments.map(item => parsePaymentTaxData(item))
        : [],
    exceptionTypes:
      _data.ExceptionTypes &&
      Array.isArray(_data.ExceptionTypes) &&
      exceptionTypesConfig &&
      exceptionTypesConfig.length > 0
        ? _data.ExceptionTypes.reduce((result, item) => {
            if (
              exceptionTypesConfig.find(t => t.id == item.Id) &&
              !result.includes(item.Id)
            )
              result.push(item.Id);
            return result;
          }, []).sort((x, y) => y.id - x.id)
        : [],
    notes: _data.Notes,
    exceptionAmount: _data.ExceptionAmount,
    detail: _data.Details
      ? _data.Details.map(item => parseTransactionItem(item))
      : [],
  });

export const POSModel = types
  .model({
    showChartView: types.boolean,
    filterParams: types.maybeNull(ExceptionParamsModel),
    groupFilter: types.string,
    transactionFilter: types.string,
    // isBackFromFCM: types.boolean,
    exceptionsGroup: types.maybeNull(ExceptionGroupModel),
    // exceptionsGroupByEmployee: types.array(ExceptionGroupModel), // use with computed views
    exceptionTypesConfig: types.array(ExceptionTypeModel),
    selectedEmployee: types.maybeNull(types.reference(EmployeeExceptionModel)),

    transactionsList: types.array(TransactionModel),
    selectedTransaction: types.maybeNull(types.reference(TransactionModel)),
    notifiedTransaction: types.maybeNull(TransactionModel),

    isLoading: types.boolean,
    // isGroupLoading: types.boolean,

    sortField: types.optional(types.number, ExceptionSortField.RatioToSale),
  })
  // .volatile(self => ({
  //   retainNotifiedTransaction: null,
  // }))
  .views(self => ({
    get exceptionTypesData() {
      return self.exceptionTypesConfig.map(item => getSnapshot(item));
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
    get filteredTransactions() {
      return self.transactionFilter.length == 0
        ? self.transactionsList
        : transactionsList.filter(trans => {
            const filterStr = self.transactionFilter.toLowerCase();
            return (
              trans.camName.toLowerCase().includes(filterStr) ||
              trans.shiftName.toLowerCase().includes(filterStr) ||
              trans.checkName.toLowerCase().includes(filterStr) ||
              trans.cardName.toLowerCase().includes(filterStr) ||
              trans.terminalName.toLowerCase().includes(filterStr) ||
              trans.tranDate.toLowerCase().includes(filterStr)
            );
          });
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
        pSize: __DEV__ ? 5 : 20,
        sDate: __DEV__
          ? '20210901000000'
          : yesterday.startOf('day').toFormat(DateFormat.QuerryDateTime),
        // sDate: '20210901000000', // for testing
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
    setExceptionFilter(value) {
      self.exceptionFilter = value;
    },
    setSortField(value) {
      if (value < 0 || value >= ExceptionSortField.Count) {
        console.log('GOND setSortField out of bound: ', value);
        return;
      }
      self.sortField = value;
    },
    selectEmployee(value) {
      self.selectedEmployee = value;
    },
    selectTransaction(value) {
      self.selectedTransaction = value;
    },
    // #endregion Setters
    // #region Get data
    getExceptionTypes: flow(function* () {
      let res = yield apiService.get(
        ExceptionRoute.controller,
        apiService.configToken.userId,
        ExceptionRoute.getTransactionTypes
      );

      // __DEV__ && console.log('GOND exceptionTypes = ', res);
      if (!res || res.error) {
        snackbar.handleRequestFailed();
      }
      self.exceptionTypesConfig = Array.isArray(res)
        ? res.map(item => parseExceptionType(item))
        : [];
      // __DEV__ &&
      //   console.log('GOND self.exceptionTypesConfig = ', self.exceptionTypesConfig);
    }),
    getExceptionsSummary: flow(function* () {
      if (!self.filterParams) {
        __DEV__ && console.log('GOND getExceptionsSummary, params not set yet');
        return;
      }
      self.isLoading = true;
      __DEV__ &&
        console.log(
          'GOND getExceptionsSummary, params = ',
          getSnapshot(self.filterParams)
        );
      try {
        const res = yield apiService.get(
          ExceptionRoute.controller,
          '',
          '',
          self.filterParams.requestParams
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

      if (!self.filterParams) {
        self.setDefaultParams([siteKey]);
      }
      // self.isGroupLoading = true;
      // self.filterParams.setParams({siteKey});
      if (self.exceptionsGroupData[siteIndex].employees.length > 0) {
        __DEV__ &&
          console.log(
            'GOND get Exception group data, site data already existed!'
          );
        // self.isGroupLoading = false;
        return;
      }
      try {
        const res = yield apiService.get(ExceptionRoute.controller, '', '', {
          ...self.filterParams.requestParams,
          groupby: GroupByException.EMPL,
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
          // self.isGroupLoading = false;
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

            siteKey: item.SiteKey,
            siteName: item.SiteName,
            pacId: item.PacId,
          })
        ).sort((x, y) => y.riskFactor - x.riskFactor);
      } catch (error) {
        __DEV__ && console.log('GOND getGroupDetailData error = ', error);
      }
      // self.isGroupLoading = false;
    }),
    getEmployeeTransactions: flow(function* (employee, page = 1) {
      let _employee =
        employee ?? self.selectedEmployee ? self.selectedEmployee : null;
      if (!_employee || page <= 0) {
        __DEV__ &&
          console.log('GOND getEmployeeTransactions none employee selected');
        return;
      }
      if (page == 1) {
        self.transactionsList = [];
      }

      self.isLoading = true;
      if (!self.filterParams) {
        self.setDefaultParams([_employee.siteKey]);
      }

      if (self.exceptionTypesConfig.length == 0) {
        yield self.getExceptionTypes();
      }

      try {
        const res = yield apiService.get(
          ExceptionRoute.controller,
          _employee.employeeId ?? '0',
          '',
          {
            ...self.filterParams.requestParams,
            sites: _employee.siteKey,
            groupby: GroupByException.EMPL,
            page,
          }
        );
        __DEV__ && console.log('GOND getEmployeeTransactions = ', res);

        if (
          !res ||
          !res.Data ||
          !Array.isArray(res.Data) ||
          res.Data.length == 0
        ) {
          __DEV__ && console.log('GOND getEmployeeTransactions no data:', res);
          self.isLoading = false;
          return;
        }

        // parse data:
        if (page > 1) {
          res.Data.forEach(trans => {
            const newTrans = _parseTransactionData(
              trans,
              self.exceptionTypesConfig
            );
            self.transactionsList.push(newTrans);
          });
        } else {
          self.transactionsList = res.Data.map(trans =>
            _parseTransactionData(trans, self.exceptionTypesConfig)
          );
        }
      } catch (error) {
        __DEV__ && console.log('GOND getEmployeeTransactions error = ', error);
      }
      self.isLoading = false;
    }),
    getTransaction: flow(function* (transactionId) {
      // dongpt: OMG how to prevent this b#ll sh!t?
      if (
        self.notifiedTransaction &&
        transactionId == self.notifiedTransaction.tranId &&
        self.selectedTransaction &&
        self.selectedTransaction.tranId == transactionId
      )
        return self.notifiedTransaction;

      let _transId =
        transactionId ??
        (self.selectedTransaction ? self.selectedTransaction.tranId : null);
      if (!_transId) {
        __DEV__ &&
          console.log(
            'GOND getTransaction no transId nor selected transaction!!!'
          );
        return;
      }

      // __DEV__ && console.log('GOND getTransaction: selected!', _trans);
      // if (!_trans) {
      //   __DEV__ &&
      //     console.log(
      //       'GOND getTransaction: transactionId not valid nor provided!'
      //     );
      //   return;
      // }

      self.isLoading = true;
      let resultTrans = null;
      try {
        const res = yield apiService.get(TransactionRoute.controller, _transId);
        __DEV__ && console.log('GOND getTransaction = ', res);

        const _trans =
          self.notifiedTransaction &&
          self.notifiedTransaction.tranId == _transId
            ? self.notifiedTransaction
            : self.transactionsList.find(t => t.tranId == _transId);
        if (_trans) {
          _trans.addDetails(res.Details);
          resultTrans = _trans;
        } else {
          self.notifiedTransaction = _parseTransactionData(res);
          resultTrans = self.notifiedTransaction;
        }
      } catch (error) {
        __DEV__ && console.log('GOND getTransaction error = ', error);
        return;
      }
      self.isLoading = false;
      return resultTrans;
    }),
    // #endregion Get data
    // #region Utilities
    getTransactionSnapShot(trans) {
      if (!trans) return;
      return {
        controller: ExceptionRoute.controller,
        action: CommonActions.image,
        id: trans.tranId,
        param: {
          thumb: true,
          download: false,
          next: false,
        },
        no_img: No_Image,
      };
    },
    onExceptionNotification: flow(function* (data) {
      if (!data || !data.TranID) {
        __DEV__ &&
          console.log(
            'GOND onExceptionNotification: transaction ID not exist: ',
            data
          );
        return false;
      }
      self.selectedTransaction = null;
      __DEV__ && console.log('GOND onExceptionNotification notifData: ', data);
      const result = yield self.getTransaction(data.TranID);
      try {
        __DEV__ && console.log('GOND onExceptionNotification trans: ', result);
        if (result) self.selectTransaction(result.id);
      } catch (err) {
        __DEV__ && console.log('GOND assign notified exception failed: ', err);
        return false;
      }
      return true;
    }),
    // #endregion Utilities
    onExitTransactionDetail() {
      __DEV__ &&
        console.log('GOND onExitTransactionDetail ', self.selectedTransaction);
      self.selectedTransaction = null;
    },
    updateSite(site) {
      self.exceptionsGroup &&
        self.exceptionsGroup.data.map(item => {
          if (item.siteKey == site.Key) item.siteName = site.Name;
          item.employees &&
            item.employees.map(employee => {
              if (employee.siteKey == site.Key) employee.siteName = site.Name;
            });
        });
    },
    cleanUp() {
      applySnapshot(self, storeDefault);
    },
  }));

const storeDefault = {
  showChartView: true,
  filterParams: null,
  groupFilter: '',
  transactionFilter: '',
  // isBackFromFCM: types.boolean(false),
  exceptionsGroup: null,
  exceptionTypes: [],
  transactionsList: [],
  isLoading: false,
  // isGroupLoading: false,

  selectedEmployee: null,
};

const exceptionStore = POSModel.create(storeDefault);

export default exceptionStore;
