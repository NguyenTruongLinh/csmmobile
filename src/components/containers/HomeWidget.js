import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';

import {inject, observer} from 'mobx-react';

import theme from '../../styles/appearance';
import CMSColors from '../../styles/cmscolors';

class HomeWidget extends React.Component {
  constructor(props) {
    super(props);

    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // static getDerivedStateFromProps(nextProps, prevState) {
  //   return {};
  // }

  render() {
    const {
      icon,
      iconSize,
      title,
      titleStyle,
      alertCount,
      onPress,
      isDisable,
      appStore,
    } = this.props;
    const {appearance} = appStore;

    return (
      <TouchableOpacity
        onPress={isDisable ? () => {} : onPress}
        style={[
          {
            flex: 1,
            backgroundColor: CMSColors.WidgetBackground,
            flexDirection: 'column',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: CMSColors.WidgetBorder,
          },
          theme[appearance].modalContainer,
        ]}>
        <View style={{flex: 20, flexDirection: 'row-reverse'}}>
          {!isNaN(alertCount) && alertCount > 0 && !isDisable && (
            <View
              style={{
                minWidth: '24%',
                height: '100%',
                backgroundColor: CMSColors.PrimaryActive,
                borderBottomLeftRadius: 10,
                borderTopRightRadius: 16,
                justifyContent: 'center',
                paddingHorizontal: 5,
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  color: CMSColors.White,
                }}>
                {alertCount}
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            flex: 60,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Image
            source={icon}
            style={[
              {
                width: iconSize ?? '65%',
                height: iconSize ?? '65%',
              },
              isDisable ? {tintColor: CMSColors.DisableItemColor} : {},
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              // {marginBottom: 100},
              titleStyle,
              isDisable ? {color: CMSColors.DisableItemColor} : {},
            ]}>
            {title}
          </Text>
        </View>
        <View style={{flex: 20}} />
      </TouchableOpacity>
    );
  }
}

export default inject('appStore')(observer(HomeWidget));
