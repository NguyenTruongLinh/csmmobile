import React from 'react';
import {View, Text, StyleSheet, Dimensions, Animated} from 'react-native';
import PropTypes from 'prop-types';

import {inject, observer} from 'mobx-react';

import CMSTouchableIcon from './CMSTouchableIcon';
import InputTextIcon from '../controls/InputTextIcon';

import CMSColors from '../../styles/cmscolors';

import commonStyles from '../../styles/commons.style';
import {Comps as CompTxt} from '../../localization/texts';

const SEARCHBAR_HEIGHT = 52;

class CMSSearchbar extends React.Component {
  static propTypes = {
    value: PropTypes.string,
    onFilter: PropTypes.func,
    animation: PropTypes.bool,
  };

  static defaultProps = {
    value: '',
    onFilter: () => console.log('GOND CMSSearchbar: onFilter not defined yet!'),
    animation: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      showSearchbar: false,
      searchViewHeight: new Animated.Value(0),
      searchbarPosition: new Animated.Value(-SEARCHBAR_HEIGHT),
    };

    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getSearchButton = callback => {
    return (
      <CMSTouchableIcon
        size={24}
        onPress={() => {
          this.setState({showSearchbar: !this.state.showSearchbar}, () => {
            this.props.animation &&
              Animated.parallel([
                Animated.timing(this.state.searchbarPosition, {
                  toValue: this.state.showSearchbar ? 0 : -SEARCHBAR_HEIGHT, // : 0,
                  duration: 500,
                  useNativeDriver: false,
                }),
                Animated.timing(this.state.searchViewHeight, {
                  toValue: this.state.showSearchbar ? SEARCHBAR_HEIGHT : 0,
                  duration: 500,
                  useNativeDriver: false,
                }),
              ]).start();

            if (callback && typeof callback == 'function') {
              callback();
            }
          });
        }}
        color={
          this.state.showSearchbar
            ? CMSColors.PrimaryActive
            : CMSColors.ColorText
        }
        styles={commonStyles.headerIcon}
        iconCustom="searching-magnifying-glass"
      />
    );
  };

  render() {
    const {onFilter, value, animation} = this.props;
    const {searchViewHeight, searchbarPosition, showSearchbar} = this.state;

    return animation || showSearchbar ? (
      <Animated.View
        style={[
          commonStyles.flatSearchBarContainer,
          animation ? {height: searchViewHeight, top: searchbarPosition} : {},
        ]}>
        <InputTextIcon
          label=""
          value={value}
          onChangeText={onFilter}
          placeholder={CompTxt.searchPlaceholder}
          iconCustom="searching-magnifying-glass"
          disabled={false}
          iconPosition="right"
          iconStyle={{
            position: 'absolute',
            right: -10,
            top: 5,
          }}
        />
      </Animated.View>
    ) : null;
  }
}

const styles = StyleSheet.create({});

export default inject('appStore')(observer(CMSSearchbar));
