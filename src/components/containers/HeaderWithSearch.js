import React from 'react';
import {View, Text, StyleSheet, Dimensions, BackHandler} from 'react-native';
import PropTypes from 'prop-types';

// import {onPatch} from 'mobx-state-tree';
import {inject, observer} from 'mobx-react';
import {Searchbar} from 'react-native-paper';
import Orientation from 'react-native-orientation-locker';

import CMSTouchableIcon from './CMSTouchableIcon';
import BackButton from '../controls/BackButton';

import CMSColors from '../../styles/cmscolors';
import variables from '../../styles/variables';
import commonStyles from '../../styles/commons.style';
import {Comps as CompTxt} from '../../localization/texts';

class HeaderWithSearch extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    onChangeSearchText: PropTypes.func,
    searchValue: PropTypes.string,
    navigator: PropTypes.object,
    extraButton: PropTypes.func,
    onClickExtraButton: PropTypes.func,
  };

  static defaultProps = {
    title: '',
    onChangeSearchText: null,
    searchValue: '',
    // onAndroidBackPress: null,
    backButton: false,
    navigator: null,
  };

  constructor(props) {
    super(props);

    // onPatch(props.appStore, this.onStoreChange);
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onHardwareBackPress);
    Orientation.addDeviceOrientationListener(this.onOrientationChange);
    this.refreshHeader();
  }

  componentWillUnmount() {
    this.props.appStore.enableSearchbar(false);
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.onHardwareBackPress
    );
    Orientation.removeDeviceOrientationListener(this.onOrientationChange);
  }

  componentDidUpdate(prevProps, prevState) {
    __DEV__ &&
      console.log('GOND HeaderWithSearch componentDidUpdate ', this.props);
    this.refreshHeader();
  }

  // onStoreChange = newValues => {
  //   __DEV__ && console.log('GOND HeaderWithSearch onStoreChange: ', newValues);
  //   // this.refreshHeader();
  // };

  onOrientationChange = orientation => {
    this.refreshHeader();
  };

  refreshHeader = () => {
    const {
      appStore,
      title,
      onChangeSearchText,
      searchValue,
      navigator,
      // showSearchBar,
    } = this.props;

    if (!navigator || typeof navigator.setOptions !== 'function') {
      __DEV__ &&
        console.log('GOND Warning: navigator prop is not a navigation object');
      return;
    }

    const options = appStore.showSearchBar
      ? {
          headerTitle: () => (
            <View style={{width: Dimensions.get('window').width}}>
              <Searchbar
                // style={{paddingTop: variables.StatusBarHeight}}
                autoFocus
                icon={{source: 'arrow-left', direction: 'auto'}}
                onIconPress={() => appStore.enableSearchbar(false)}
                placeholder={CompTxt.searchPlaceholder}
                value={searchValue}
                onChangeText={onChangeSearchText}
              />
            </View>
          ),
          headerRight: () => {},
        }
      : {
          headerTitle: title,
          headerRight: () => (
            <CMSTouchableIcon
              size={22}
              onPress={() => appStore.enableSearchbar(true)}
              color={CMSColors.DarkPrimaryColor}
              styles={commonStyles.buttonSearchHeader}
              iconCustom="searching-magnifying-glass"
            />
          ),
        };
    navigator.setOptions(options);
  };

  onHardwareBackPress = () => {
    __DEV__ && console.log('GOND HeaderWithSearch onHardBackPress');
    const {appStore} = this.props;
    if (appStore.showSearchBar) {
      appStore.enableSearchbar(false);
      return true;
    }
    return false;
  };

  render() {
    console.log('GOND HeaderWithSearch render ', this.props);
    return null;
    // (
    //   <View
    //     key={
    //       'headersearch_' +
    //       this.props.appStore.showSearchBar +
    //       '_' +
    //       this.props.searchValue
    //     }
    //   />
    // );
  }
}

export default inject('appStore')(observer(HeaderWithSearch));
