import {types} from 'mobx-state-tree';

export const db_domain = types.model({
  Id: types.number,
  Url: types.string,
  Active: types.boolean,
});
export const db_user = types.model({
  Id: types.number,
  UserId: types.number,
  UserName: types.string,
  FName: types.string,
  LName: types.string,
  Token: types.string,
  ApiKey: types.string,
  DomainId: types.number,
  Active: types.boolean,
});
export const db_alertconfig = types.model({
  Id: types.number,
  Alttype: types.number,
  Pin: types.boolean,
  DomainId: types.number,
  Kdvr: types.number,
});

export const db_Sites = types.model({
  name: types.string,
  number: types.number,
});
