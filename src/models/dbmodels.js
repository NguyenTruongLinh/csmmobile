import { types } from 'mobx-state-tree';

export const db_domain = types.model({
  Id: types.integer,
  Url: types.string,
  Active: types.boolean,
});
export const db_user = types.model({
    Id: types.integer,
    UserId: types.integer,
    UserName: types.string,
    FName: types.string,
    LName: types.string,
    Token: types.string,
    ApiKey: types.string,
    DomainId: types.integer,
    Active: types.boolean,
});
export const db_alertconfig = types.model({
    Id: types.integer,
    Alttype: types.integer,
    Pin: types.boolean,
    DomainId: types.integer,
    Kdvr: types.integer
});

export const db_Sites = types.model({
    name: types.string,
    number: types.integer
})