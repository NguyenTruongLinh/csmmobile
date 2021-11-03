import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

import {Tabbar as Labels} from '../localization/texts';
import CMSColors from '../styles/cmscolors';
import {IconCustom} from '../components/CMSStyleSheet';
import ROUTERS from '../consts/routes';

const TabIcons = [
  'ic_home_24px',
  'videocam-filled-tool',
  'notifications-button',
  'ic_settings_24px',
];
const TabLabels = [Labels.home, Labels.video, Labels.alarm, Labels.settings];
const HideTabbarScreens = [ROUTERS.VIDEO_PLAYER, ROUTERS.HEALTH_VIDEO];

export default class extends React.Component {
  constructor(props) {
    super(props);

    if (typeof props.naviSetter == 'function') {
      props.naviSetter(props.navigation);
    }
  }

  getCurrentRouteName = (navigation, state) => {
    while (state) {
      const currentRoute = state.routes[state.index];
      state = currentRoute.state;
      if (!state) return currentRoute.name;
    }
  };

  render() {
    const {navigation, state} = this.props;
    const currentIndex = state.index;
    // const currentRoute = state.routes[state.index];
    const {width, height} = Dimensions.get('window');
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
      HideTabbarScreens.includes(this.getCurrentRouteName(navigation, state))
    )
      return null;
    return (
      <View style={[styles.container, {height: height / 10}]}>
        {state.routes.map((route, index) => {
          const isSelected = index === currentIndex;
          const textStyle = isSelected ? styles.textSelected : undefined;
          return (
            <TouchableOpacity
              key={route.name}
              onPress={() => navigation.jumpTo(route.name)}
              style={styles.tab}>
              <IconCustom
                style={styles.icon}
                name={TabIcons[index]}
                size={30}
                color={
                  isSelected ? CMSColors.PrimaryActive : CMSColors.SecondaryText
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

// export default CMSTabbar;

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
