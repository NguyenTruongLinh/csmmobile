import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import {inject, observer} from 'mobx-react';

import {getCurrentRouteName} from '../util/general';
import {Tabbar as Labels} from '../localization/texts';
import CMSColors from '../styles/cmscolors';
import {IconCustom} from '../components/CMSStyleSheet';
import ROUTERS, {INIT_ROUTE_MAP} from '../consts/routes';
import {WIDGET_COUNTS} from '../consts/misc';

const TabIcons = [
  'ic_home_24px',
  'videocam-filled-tool',
  'notifications-button',
  'ic_settings_24px',
];
const TabLabels = [Labels.home, Labels.video, Labels.alarm, Labels.settings];
const HideTabbarScreens = [ROUTERS.VIDEO_PLAYER, ROUTERS.HEALTH_VIDEO];

class CMSTabbar extends React.Component {
  constructor(props) {
    super(props);
    const {height} = Dimensions.get('window');

    this.state = {
      height: height / 10,
    };
  }

  onTabPress = (isDisable, navigation, routeName, userStore) => {
    if (!isDisable) {
      __DEV__ && console.log('onTabPress', `routeName=${routeName}`);
      navigation.navigate(routeName, {
        screen: INIT_ROUTE_MAP.get(routeName),
        initial: false,
      });
    }
  };

  updateSize = () => {
    const {height} = Dimensions.get('window');

    this.setState({
      height: height / 10,
    });
  };

  render() {
    const {navigation, state, appStore, userStore} = this.props;
    const currentIndex = state.index;
    const {height} = this.state;
    // const currentRoute = state.routes[state.index];
    // const {width, height} = Dimensions.get('window');
    // const tabWidth = width / TabLabels.length;

    // __DEV__ &&
    //   console.log(
    //     'GOND createTabbar currentRoute.state = ',
    //     currentRoute.state,
    //     '\n--- getCurrentRouteName = ',
    //     this.getCurrentRouteName()
    //   );
    if (
      // currentRoute.state &&
      // HideTabbarScreens.includes(
      //   currentRoute.state.routes[currentRoute.state.index].name
      // )
      HideTabbarScreens.includes(getCurrentRouteName(state)) ||
      !appStore.showTabbar
      // (getCurrentRouteName(state) == ROUTERS.OAM_DETAIL &&
      //   !oamStore.isBottomTabShown)
    )
      return null;
    return (
      <View style={[styles.container, {height}]}>
        {state.routes.map((route, index) => {
          const isSelected = index === currentIndex;
          const isDisable = userStore.disableTabIndexes.includes(index);
          const textStyle = isDisable
            ? styles.textDisabled
            : isSelected
            ? styles.textSelected
            : undefined;
          return (
            <TouchableOpacity
              key={route.name}
              onPress={() =>
                this.onTabPress(isDisable, navigation, route.name, userStore)
              }
              style={styles.tab}>
              <IconCustom
                style={styles.icon}
                name={TabIcons[index]}
                size={30}
                color={
                  isDisable
                    ? CMSColors.DisableItemColor
                    : isSelected
                    ? CMSColors.PrimaryActive
                    : CMSColors.SecondaryText
                }
              />
              {/* <Image
                source={TabIcons[index]}
                resizeMode="contain"
                style={{
                  alignSelf: 'center',
                  width: tabWidth * 0.8,
                  tintColor: isSelected
                    ? CMSColors.PrimaryActive
                    : CMSColors.Inactive,
                }}
              /> */}
              <Text style={[styles.text, textStyle]}>{TabLabels[index]}</Text>
              {isSelected && (
                <View style={styles.highlightContainer}>
                  <View style={styles.highlightView} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }
}

export default inject('appStore', 'userStore')(observer(CMSTabbar));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
  },
  tab: {
    paddingBottom: 12,
    paddingTop: 10,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
  },
  text: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 6,
    color: CMSColors.PrimaryText,
  },
  textSelected: {
    color: CMSColors.PrimaryActive,
  },
  textDisabled: {
    color: CMSColors.DisableItemColor,
  },
  highlightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  highlightView: {
    height: 2,
    backgroundColor: '#00b0f5',
    width: 35,
  },
});
