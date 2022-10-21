const APP_INFO = {
  Title: 'Cloud Managed Services',
  Name: 'CMS Mobile 3.2',
  Version: '3.2.0.17',
  BuiltDate: 'October 21, 2022',
  CopyRight: 'Copyright © 2022 i3 International Inc.',
  // AppId: '4d53bce03ec34c0a911182d4c228ee6c',
  AppId: '89ab5a91edf94caeae6f5a38e1cc3c26',
  ContactUrl: 'https://i3international.com/contact',
  PoliciesUrl: 'https://i3international.com/company-policies',
  PrivacyPolicyUrl: 'https://i3international.com/privacy-policy',
};

exports.getStoreVersion = () => {
  const versionNumbers = APP_INFO.Version.split('.');
  if (versionNumbers.length == 4) {
    return versionNumbers.filter((val, idx) => idx != 2).join('.');
  } else if (versionNumbers.length == 3) {
    return versionNumbers.join('.');
  } else {
    console.log('GOND version number is invalid! Please correct!');
  }
};

export default APP_INFO;
