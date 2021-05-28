import RNDBModel from 'react-native-db-models';
import uuid from 'react-native-uuid';

import {isNullOrUndef} from '../util/general';

const cmsDBName = 'i3cms';

class LocalDB {
  constructor() {}

  init = async () => {
    let cmsdb = new RNDBModel.create_db(cmsDBName);

    if (isNullOrUndef(cmsdb)) {
      console.log('GOND error! Cannot init db!');
      return false;
    }
    return await new Promise(function (resolve) {
      setTimeout(() => {
        cmsdb.add({isInitialized: true}, result => {
          resolve(result);
        });
      }, 1);
    });
  };

  isFirstLaunch = async () => {
    const model = RNDBModel[cmsDBName];
    if (!model) {
      await init();
      return true;
    }
    return false;
  };

  /**
   * getDB
   * @param {string} name
   * @returns {object}
   */
  getDB = name => {
    const model = RNDBModel[name];
    if (model) return model;
    return new RNDBModel.create_db(name);
  };

  /**
   * getDeviceId
   * @returns {string}
   */
  getDeviceId = async () => {
    const d_id = await query('deviceid');
    let _id = null;
    if (d_id === undefined || d_id.totalrows == 0) {
      const guid = uuid.v1();
      _id = guid.toString();
      await _add('deviceid', {deviceid: _id});
    } else {
      _id = _first(d_id.rows); //d_id.rows[d_id.autoinc -1];
      _id = _id.deviceid;
    }
    return _id;
  };

  /**
   * _deviceId
   * @param {string} id
   * @returns {string}
   */
  _deviceId = async id => {
    //var model = getDB('deviceid');
    if (!id) {
      return await getDeviceId();
    } else {
      let oldid = await getDeviceId();
      const model = getDB('deviceid');
      await model.remove({deviceid: oldid});
      await _add('deviceid', {deviceid: id});
      return id;
    }
  };

  /**
   * _first
   * @param {object} row
   * @returns {any}
   */
  _first = rows => {
    if (!rows) return null;
    for (let name in rows) {
      return rows[name];
    }
    return null;
  };

  /**
   * _query
   * @param {string} id
   * @param {any} filter
   * @returns {any}
   */
  _query = async (name, filter = undefined) => {
    const model = getDB(name);
    // if (filter == undefined || filter == null) {
    //   promise = new Promise(resolve => {
    //     setTimeout(function () {
    //       model.get_all(function (result) {
    //         resolve(result);
    //       });
    //     }, 1);
    //   });
    // } else {
    //   promise = new Promise(function (resolve, reject) {
    //     setTimeout(function () {
    //       model.get(filter, function (result) {
    //         resolve(result);
    //       });
    //     }, 1);
    //   });
    // }
    const getter = isNullOrUndef(filter) ? model.get_all : model.get;
    return await new Promise(resolve => {
      setTimeout(() => {
        getter(result => {
          resolve(result);
        });
      }, 1);
    });
  };

  /**
   * _add
   * @param {string} name
   * @param {any} data
   * @returns {any}
   */
  _add = async (name, data) => {
    const model = getDB(name);
    if (isNullOrUndef(data)) return data;
    return await new Promise(function (resolve) {
      setTimeout(() => {
        model.add(data, result => {
          resolve(result);
        });
      }, 1);
    });
  };

  /**
   * _update
   * @param {string} name
   * @param {string} new_data
   * @param {any} filter
   * @returns {any}
   */
  _update = async (name, new_data, filter) => {
    const model = getDB(name);
    if (isNullOrUndef(new_data)) return new_data;
    return await new Promise(resolve => {
      setTimeout(() => {
        //console.log('first method completed');
        model.update(filter, new_data, result => {
          resolve(result);
        });
      }, 1);
    });
  };

  /**
   * _delete
   * @param {string} name
   * @param {any} filter
   * @returns {any}
   */
  _delete = async (name, filter) => {
    const model = getDB(name);
    if (isNullOrUndef(filter)) {
      await model.erase_db(removed_data => {
        __DEV__ && console.log(removed_data);
      });
      return 1;
    }

    return await new Promise(resolve => {
      setTimeout(() => {
        model.remove(filter, result => {
          resolve(result);
        });
      }, 1);
    });
  };

  initDomains = () => new RNDBModel.create_db('domains');
  initUsers = () => new RNDBModel.create_db('users');
  initAlertconfig = () => new RNDBModel.create_db('alertconfig');
}

const dbService = new LocalDB();
export default dbService;

// module.exports = {
//   domains: new RNDBModel.create_db('domains'),
//   users: new RNDBModel.create_db('users'),
//   alertconfig: new RNDBModel.create_db('alertconfig'),
//   deviceid: _deviceid,
//   query: _query,
//   add: _add,
//   update: _update,
//   delete: _delete,
// };
