const {NOTIFY_ACTION, LOGIN_ACTIONS} = require('../consts/misc');

function updateSite(sitesStore) {
  // sitesStore.getOAMSites();
  // sitesStore.getAllSites();
  sitesStore.updateSite;
}

function onSiteEvent(
  sitesStore,
  healthStore,
  oamStore,
  exceptionStore,
  action,
  content
) {
  let noti = null;
  let type = null;
  __DEV__ && console.log('onSiteEvent', `content=${JSON.stringify(content)}`);
  __DEV__ && console.log('onSiteEvent', `action=${action}`);
  // let content = JSON.parse(content);
  switch (action) {
    case NOTIFY_ACTION.ADD:
      type = LOGIN_ACTIONS.USER_SITES_ADD;
      noti = {
        body: "Site '" + content.Name + "' has added.",
      };
      break;
    case NOTIFY_ACTION.EDIT:
      type = LOGIN_ACTIONS.USER_SITES_EDIT;
      noti = {
        body: "Site '" + content.Name + "' has updated.",
      };
      break;
    case NOTIFY_ACTION.DELETE:
      type = LOGIN_ACTIONS.USER_SITES_DELETE;
      noti = {
        body: "Site '" + content.Name + "' has deleted.",
      };
      break;
    default:
      noti = {};
      break;
  }
  noti.title = 'CMS Site.';
  if (content) {
    if (sitesStore) sitesStore.updateSite(content);
    if (healthStore) healthStore.updateSite(content);
    if (oamStore) oamStore.notifyUpdate(content);
    if (exceptionStore) exceptionStore.updateSite(content);
  }
  noti.isContent = false;
  return noti;
}

module.exports = {
  onSiteEvent,
};
