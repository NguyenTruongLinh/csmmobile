import RNDBModel from 'react-native-db-models';
import uuid from 'react-native-uuid';

import {isNullOrUndef} from '../util/general';
import {LocalDBName} from '../consts/misc';
import {mode} from 'crypto-js';

const cmsDBName = 'i3cms';

class LocalDB {
  constructor() {
    new RNDBModel.create_db(LocalDBName.user);
    new RNDBModel.create_db(LocalDBName.device);
    // new RNDBModel.create_db(LocalDBName.alertConfig);
  }

  firstInit = async () => {
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
    // const model = RNDBModel[cmsDBName];
    // __DEV__ && console.log('GOND get initdb = ', new RNDBModel.create_db());
    // if (!model) {
    //   __DEV__ && console.log('GOND first launch init');
    //   await this.firstInit();
    //   return true;
    // }
    // __DEV__ && console.log('GOND not first launch');
    // return false;
    const _device = await this.query(LocalDBName.device);
    __DEV__ &&
      console.log(
        'GOND get initdb = ',
        _device,
        ', first = ',
        this.first(_device.rows)
      );
    if (!_device && !this.first(_device.rows)) {
      __DEV__ && console.log('GOND first launch init');
      await this.getDeviceId();
      return true;
    }
    __DEV__ && console.log('GOND not first launch');
    return false;
  };

  /**
   * getDB
   * @param {string} dbName
   * @returns {object}
   */
  getDB = dbName => {
    const model = RNDBModel[dbName];
    if (model) return model;
    return new RNDBModel.create_db(dbName);
  };

  /**
   * getDeviceId
   * @returns {string}
   */
  getDeviceId = async () => {
    const d_id = await this.query(LocalDBName.device);
    if (d_id === undefined || d_id.totalrows == 0) {
      const guid = uuid.v1();
      let _id = guid.toString();
      await this.add(LocalDBName.device, {deviceid: _id});
      return _id;
    } else {
      return this.first(d_id.rows).deviceid;
    }
  };

  /**
   * deviceId
   * @param {string} id
   * @returns {string}
   */
  deviceId = async id => {
    //var model = getDB('deviceid');
    if (!id) {
      return await this.getDeviceId();
    } else {
      let oldid = await getDeviceId();
      const model = this.getDB(LocalDBName.device);
      await model.remove({deviceid: oldid});
      await this.add(LocalDBName.device, {deviceid: id});
      return id;
    }
  };

  /**
   * first
   * @param {object} rows
   * @returns {object} : first data
   */
  first = rows => {
    if (!rows) return null;
    for (let name in rows) {
      return rows[name];
    }
    return null;
  };

  /**
   *
   * @param {string} dbName
   * @returns {object} first row in db
   */
  getFirstData = async dbName => {
    const model = this.getDB(dbName);
    const data = await new Promise(resolve => {
      setTimeout(() => {
        model.get_all(result => {
          resolve(result);
        });
      }, 1);
    });
    // __DEV__ && console.log('GOND get first data ', dbName, ': ', data);
    return this.first(data.rows);
  };

  /**
   * _query
   * @param {string} id
   * @param {any} filter
   * @returns {any}
   */
  query = async (dbName, filter = undefined) => {
    const model = this.getDB(dbName);
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
    return await new Promise(resolve => {
      setTimeout(() => {
        isNullOrUndef(filter)
          ? model.get_all(result => {
              resolve(result);
            })
          : model.get(filter, result => {
              resolve(result);
            });
      }, 1);
    });
  };

  /**
   * add
   * @param {string} dbName
   * @param {any} data
   * @returns {any}
   */
  add = async (dbName, data) => {
    const model = this.getDB(dbName);
    if (isNullOrUndef(data)) return data;
    return await new Promise(function (resolve) {
      setTimeout(() => {
        model.add(data, result => {
          __DEV__ &&
            console.log(
              'GOND add db: ',
              dbName,
              ', data: ',
              data,
              '\n => ',
              result
            );
          resolve(result);
        });
      }, 1);
    });
  };

  /**
   * _update
   * @param {string} dbName
   * @param {string} new_data
   * @param {any} filter
   * @returns {any}
   */
  update = async (dbName, new_data, filter) => {
    const model = this.getDB(dbName);
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
   * @param {string} dbName
   * @param {any} filter
   * @returns {any}
   */
  delete = async (dbName, filter) => {
    const model = this.getDB(dbName);
    if (isNullOrUndef(filter)) {
      await model.erase_db(removed_data => {
        __DEV__ && console.log('GOND removed from localdb: ', removed_data);
      });
      return 1;
    }

    return await new Promise(resolve => {
      setTimeout(() => {
        model.remove(filter, result => {
          __DEV__ && console.log('GOND removed all from localdb: ', result);
          resolve(result);
        });
      }, 1);
    });
  };
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
