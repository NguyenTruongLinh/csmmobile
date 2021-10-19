import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';

import CMSColors from '../../styles/cmscolors';

export default class HomeWidget extends React.Component {
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
    const {icon, iconSize, title, titleStyle, alertCount, onPress} = this.props;

    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flex: 1,
          backgroundColor: CMSColors.WidgetBackground,
          flexDirection: 'column',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: CMSColors.WidgetBorder,
        }}>
        <View style={{flex: 20, flexDirection: 'row-reverse'}}>
          {alertCount && (
            <View
              style={{
                width: '24%',
                height: '100%',
                backgroundColor: CMSColors.PrimaryActive,
                borderBottomLeftRadius: 10,
                borderTopRightRadius: 16,
                justifyContent: 'center',
              }}>
              <Text style={{textAlign: 'center', color: CMSColors.White}}>
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
            style={{
              width: iconSize ?? '65%',
              height: iconSize ?? '65%',
            }}
            resizeMode="contain"
          />
          <Text style={[{marginTop: 25}, titleStyle]}>{title}</Text>
        </View>
        <View style={{flex: 20}} />
      </TouchableOpacity>
    );
  }
}
